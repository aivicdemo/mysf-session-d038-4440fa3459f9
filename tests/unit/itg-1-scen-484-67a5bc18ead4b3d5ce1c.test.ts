import { displayCustomerTransactionHistory, DisplayCustomerTransactionHistoryInput, DisplayCustomerTransactionHistoryOutput } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-484: 業務ルール：請求金額が商談金額より少ない場合、差異理由が「部分請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return DisplayCustomerTransactionHistoryOutput with partial_invoiced mismatch reason', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

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
          dealId: 'deal-2026-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'A社 システム導入',
          dealAmount: 1000000,
          stageId: 'stage-001',
          expectedContractDate: '2026-09-01',
          contractedDate: '2026-06-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-06-01T00:00:00Z',
          updatedAt: '2026-09-15T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-2026-001',
            dealId: 'deal-2026-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-2026-001',
            invoiceDate: '2026-09-20',
            dueDate: '2026-10-20',
            invoiceAmount: 800000,
            taxAmount: 80000,
            untaxedAmount: 720000,
            invoiceStatus: 'issued',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'ok',
            referenceIntegrityVerificationStatus: 'ok',
            createdAt: '2026-09-20T00:00:00Z',
            updatedAt: '2026-09-20T00:00:00Z',
            createdBy: 'user-001',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod to return one invoice with partial amount
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-2026-001',
          dealId: 'deal-2026-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-09-20',
          dueDate: '2026-10-20',
          invoiceAmount: 800000,
          taxAmount: 80000,
          untaxedAmount: 720000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'ok',
          referenceIntegrityVerificationStatus: 'ok',
          createdAt: '2026-09-20T00:00:00Z',
          updatedAt: '2026-09-20T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    // Mock validateInvoiceReferenceIntegrity to return inconsistencies with amount mismatch
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      dealId: 'deal-2026-001',
      isValid: false,
      invoiceIds: ['inv-2026-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amount_mismatch',
          description: 'partial_invoiced',
          affectedRecordId: 'inv-2026-001',
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

    // Verify transactionHistory contains both deal and invoice records
    expect(result.transactionHistory.length).toBeGreaterThanOrEqual(1);
    const dealRecord = result.transactionHistory.find((r) => r.recordType === 'deal' && r.recordId === 'deal-2026-001');
    expect(dealRecord).toBeDefined();
    expect(dealRecord?.amount).toBe(1000000);

    const invoiceRecord = result.transactionHistory.find((r) => r.recordType === 'invoice' && r.recordId === 'inv-2026-001');
    expect(invoiceRecord).toBeDefined();
    expect(invoiceRecord?.amount).toBe(800000);

    // Verify inconsistencies contain amount mismatch inconsistency
    expect(result.inconsistencies.length).toBeGreaterThanOrEqual(1);
    const inconsistency = result.inconsistencies.find((i) => i.dealId === 'deal-2026-001' && i.inconsistencyType === 'amount_mismatch');
    expect(inconsistency).toBeDefined();
    expect(inconsistency?.invoiceId).toBe('inv-2026-001');
    expect(inconsistency?.expectedValue).toBe(1000000);
    expect(inconsistency?.actualValue).toBe(800000);
    expect(inconsistency?.differenceAmount).toBe(200000);
    expect(inconsistency?.reason).toContain('partial_invoiced');

    // Verify specialInvoiceStatuses is empty
    expect(result.specialInvoiceStatuses).toEqual([]);

    // Verify notificationContent contains a message about the discrepancy
    expect(result.notificationContent).not.toBeNull();
    expect(typeof result.notificationContent).toBe('string');
  });
});
