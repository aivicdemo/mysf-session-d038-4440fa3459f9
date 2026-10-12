import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-455: 業務ルール：成績金額が請求金額より大きく、請求金額がゼロの場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異理由が「未請求」と判定される', async () => {
    const customerId = 'cust-001';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

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
        customerName: '株式会社テスト商社',
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
        createdAt: '2026-08-01T09:00:00Z',
        updatedAt: '2026-08-01T09:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: '契約A',
          dealAmount: 1000000,
          stageId: 'stage-won',
          expectedContractDate: '2026-08-15',
          contractedDate: '2026-08-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-08-01T09:00:00Z',
          updatedAt: '2026-08-15T09:00:00Z',
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
            invoiceDate: '2026-09-01',
            dueDate: '2026-10-01',
            invoiceAmount: 0,
            taxAmount: 0,
            untaxedAmount: 0,
            invoiceStatus: '未発行',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-01T09:00:00Z',
            updatedAt: '2026-09-01T09:00:00Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    };

    const mockValidateIntegrity = {
      dealId: 'all',
      isValid: false,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amountMismatch',
          description: '未請求',
          affectedRecordId: 'deal-001',
        },
      ],
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

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('株式会社テスト商社');
    expect(result.transactionHistory).toBeDefined();
    expect(Array.isArray(result.transactionHistory)).toBe(true);
    expect(result.inconsistencies.length).toBeGreaterThan(0);
    expect(result.inconsistencies[0].reason).toContain('未請求');
  });
});
