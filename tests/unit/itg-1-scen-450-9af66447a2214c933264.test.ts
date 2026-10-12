import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-450: 正常系：顧客ID・ユーザーID・日時が正当で、商談と請求の履歴が存在し、データ整合性が取れている場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('統合履歴と空の不整合リストが返される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-15T10:30:00.000Z');

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
        customerName: '顧客名',
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
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'A社システム導入',
          dealAmount: 500000,
          stageId: 'stage-won',
          expectedContractDate: '2026-08-15',
          contractedDate: '2026-08-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-09-15T00:00:00.000Z',
          createdBy: 'system',
        },
        {
          dealId: 'deal-002',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'B社保守契約',
          dealAmount: 200000,
          stageId: 'stage-won',
          expectedContractDate: '2026-09-10',
          contractedDate: '2026-09-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-20T00:00:00.000Z',
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
            invoiceDate: '2026-09-10',
            dueDate: '2026-10-10',
            invoiceAmount: 500000,
            taxAmount: 0,
            untaxedAmount: 500000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-10T00:00:00.000Z',
            updatedAt: '2026-09-10T00:00:00.000Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
        {
          invoice: {
            invoiceId: 'inv-002',
            dealId: 'deal-002',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-002',
            invoiceDate: '2026-09-25',
            dueDate: '2026-10-25',
            invoiceAmount: 200000,
            taxAmount: 0,
            untaxedAmount: 200000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-25T00:00:00.000Z',
            updatedAt: '2026-09-25T00:00:00.000Z',
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
      invoiceIds: ['inv-001', 'inv-002'],
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

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('顧客名');
    expect(result.transactionHistory).toBeDefined();
    expect(Array.isArray(result.transactionHistory)).toBe(true);
    expect(result.inconsistencies).toEqual([]);
    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
