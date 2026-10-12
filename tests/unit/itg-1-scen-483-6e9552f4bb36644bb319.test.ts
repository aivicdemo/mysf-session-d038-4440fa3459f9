import { displayCustomerTransactionHistory, DisplayCustomerTransactionHistoryInput, DisplayCustomerTransactionHistoryOutput } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-483: 業務ルール：請求明細が存在しない場合、差異理由が「未請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return DisplayCustomerTransactionHistoryOutput with unInvoiced discrepancy reason', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    // Mock enforceAccessControlForDataDisplay to return successful access result
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      restrictions: [],
    });

    // Mock fetchCustomerWithRelatedRecords to return customer data with a deal
    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
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
        createdAt: '',
        updatedAt: '',
        createdBy: '',
        updatedBy: '',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: '案件001',
          dealAmount: 1000000,
          stageId: 'stage-001',
          expectedContractDate: '2026-09-01',
          contractedDate: '2026-08-15',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-08-01T09:00:00Z',
          updatedAt: '2026-08-15T14:30:00Z',
          createdBy: 'user-001',
        },
      ],
      activities: [],
      invoices: [],
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod to return empty array (no invoices)
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
    });

    // Mock validateInvoiceReferenceIntegrity to return inconsistencies with unInvoiced reason
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      dealId: 'deal-001',
      isValid: false,
      invoiceIds: [],
      referenceAnomalies: [
        {
          anomalyType: 'unbilled',
          description: '未請求',
          affectedRecordId: 'deal-001',
        },
      ],
      validationTimestamp: currentDateTime,
    });

    const input: DisplayCustomerTransactionHistoryInput = {
      customerId,
      loginUserId,
      currentDateTime,
    };

    const result: DisplayCustomerTransactionHistoryOutput = await displayCustomerTransactionHistory(input);

    expect(result).toBeDefined();
    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerName).toBe('テスト顧客A');

    // Verify transactionHistory contains deal-001
    expect(result.transactionHistory.length).toBeGreaterThanOrEqual(1);
    const dealRecord = result.transactionHistory.find((r) => r.recordType === 'deal' && r.recordId === 'deal-001');
    expect(dealRecord).toBeDefined();
    expect(dealRecord?.amount).toBe(1000000);

    // Verify inconsistencies contain unbilled inconsistency
    expect(result.inconsistencies.length).toBeGreaterThanOrEqual(1);
    const inconsistency = result.inconsistencies.find((i) => i.dealId === 'deal-001' && i.inconsistencyType === 'unbilled');
    expect(inconsistency).toBeDefined();
    expect(inconsistency?.reason).toContain('未請求');

    // Verify specialInvoiceStatuses is empty
    expect(result.specialInvoiceStatuses).toEqual([]);

    // Verify notificationContent is not null and contains a message
    expect(result.notificationContent).not.toBeNull();
    expect(typeof result.notificationContent).toBe('string');
  });
});
