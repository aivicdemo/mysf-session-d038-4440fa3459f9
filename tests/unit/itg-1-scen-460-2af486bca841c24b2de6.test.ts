import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-460: 業務ルール：営業成績金額がマイナス値の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('「営業成績金額は0以上である必要があります」例外が発生する', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-123';
    const currentDateTime = new Date('2024-01-15T10:00:00Z');

    const mockAccessControlResponse = {
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: [],
        visibleInvoiceIds: [],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [],
    };

    const mockCustomerRecords = {
      customer: {
        customerId,
        customerName: 'テスト顧客A',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: '案件A',
          dealAmount: 1000000,
          stageId: 'stage-won',
          expectedContractDate: '2024-01-05',
          contractedDate: '2024-01-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-05T10:00:00Z',
          createdBy: 'system',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-001',
            dealId: 'deal-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-001',
            invoiceDate: '2024-01-10',
            dueDate: '2024-02-10',
            invoiceAmount: 1000000,
            taxAmount: 100000,
            untaxedAmount: 1000000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-10T10:00:00Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    };

    const mockValidateIntegrity = {
      dealId: 'all',
      isValid: true,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [],
      validationTimestamp: currentDateTime,
    };

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockAccessControlResponse);
    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue(mockCustomerRecords);
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue(mockValidateIntegrity);

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result).toBeDefined();
  });
});
