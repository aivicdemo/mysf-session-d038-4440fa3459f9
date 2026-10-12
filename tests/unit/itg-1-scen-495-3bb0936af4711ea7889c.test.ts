import { jest } from '@jest/globals';
import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import type { DisplayCustomerTransactionHistoryInput } from '../../src/logic/customer-transaction-history';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<any>('../../src/logic/data-persistence'),
  fetchCustomerWithRelatedRecords: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
}));

jest.mock('../../src/logic/deal-invoice-reconciliation', () => ({
  ...jest.requireActual<any>('../../src/logic/deal-invoice-reconciliation'),
  validateInvoiceReferenceIntegrity: jest.fn(),
}));

jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<any>('../../src/logic/access-control-enforcement'),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

const mockDataPersistence = jest.requireMock('../../src/logic/data-persistence') as any;
const mockDealInvoiceReconciliation = jest.requireMock('../../src/logic/deal-invoice-reconciliation') as any;
const mockAccessControl = jest.requireMock('../../src/logic/access-control-enforcement') as any;

describe('SCEN-495: 複数の不整合が同時に検出される場合、すべての不整合が不整合リストに追加される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect multiple inconsistencies and include all in inconsistencies array', async () => {
    const customerId = 'cust-uuid-12345';
    const loginUserId = 'user-uuid-67890';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

    const dealRecords = [
      {
        dealId: 'deal-001',
        dealName: '商談1',
        dealAmount: 1000000,
        stageId: 'stage-won',
        expectedContractDate: '2026-09-01T09:00:00Z',
        contractedDate: '2026-09-05T14:30:00Z',
        createdAt: '2026-09-01T09:00:00Z',
        updatedAt: '2026-09-05T14:30:00Z',
        createdBy: 'user-001',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        salesRepresentativeId: 'rep-001',
      },
      {
        dealId: 'deal-002',
        dealName: '商談2',
        dealAmount: 500000,
        stageId: 'stage-won',
        expectedContractDate: '2026-09-10T10:00:00Z',
        contractedDate: '2026-09-12T15:45:00Z',
        createdAt: '2026-09-10T10:00:00Z',
        updatedAt: '2026-09-12T15:45:00Z',
        createdBy: 'user-001',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        salesRepresentativeId: 'rep-001',
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'inv-001',
        dealId: 'deal-001',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2026-09-08T11:00:00Z',
        dueDate: '2026-09-30T11:00:00Z',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        untaxedAmount: 900000,
        invoiceStatus: '支払済',
        paidDate: '2026-09-20T00:00:00Z',
        paidAmount: 1000000,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-09-08T11:00:00Z',
        updatedAt: '2026-09-08T11:00:00Z',
        createdBy: 'user-001',
      },
      {
        invoiceId: 'inv-002',
        dealId: 'deal-002',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-002',
        invoiceDate: '2026-09-15T09:30:00Z',
        dueDate: '2026-09-30T09:30:00Z',
        invoiceAmount: 400000,
        taxAmount: 40000,
        untaxedAmount: 360000,
        invoiceStatus: '発行済',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-09-15T09:30:00Z',
        updatedAt: '2026-09-15T09:30:00Z',
        createdBy: 'user-001',
      },
      {
        invoiceId: 'inv-003',
        dealId: 'deal-002',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-003',
        invoiceDate: '2026-09-16T10:00:00Z',
        dueDate: '2026-09-30T10:00:00Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        untaxedAmount: 90000,
        invoiceStatus: 'キャンセル',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-09-16T10:00:00Z',
        updatedAt: '2026-09-16T10:00:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataPersistence.fetchCustomerWithRelatedRecords.mockResolvedValue({
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
        createdAt: '2026-09-01T09:00:00Z',
        updatedAt: '2026-09-01T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-001',
      },
      deals: dealRecords,
      activities: [],
      invoices: invoiceRecords.map(inv => ({
        invoice: inv,
        lineItems: [],
      })),
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchInvoicesForPeriod.mockResolvedValue({
      invoices: invoiceRecords,
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    mockDealInvoiceReconciliation.validateInvoiceReferenceIntegrity.mockResolvedValue({
      dealId: 'multi',
      isValid: false,
      invoiceIds: ['inv-001', 'inv-002', 'inv-003'],
      referenceAnomalies: [
        {
          anomalyType: 'amount_mismatch',
          description: '金額が一致しません',
          affectedRecordId: 'deal-002',
        },
        {
          anomalyType: 'status_mismatch',
          description: 'ステータスが不整合です',
          affectedRecordId: 'deal-002',
        },
      ],
      validationTimestamp: currentDateTime,
    });

    mockAccessControl.enforceAccessControlForDataDisplay.mockResolvedValue({
      accessGranted: true,
      userId: loginUserId,
      customerId,
    });

    const input: DisplayCustomerTransactionHistoryInput = {
      customerId,
      loginUserId,
      currentDateTime,
    };

    const output = await displayCustomerTransactionHistory(input);

    expect(output).toBeDefined();
    expect(output.customerId).toBe(customerId);
    expect(output.customerName).toBe('テスト顧客A');
    expect(output.inconsistencies).toBeDefined();
    expect(output.inconsistencies.length).toBeGreaterThanOrEqual(2);

    const deal002Inconsistencies = output.inconsistencies.filter(
      (inc) => inc.dealId === 'deal-002'
    );
    expect(deal002Inconsistencies.length).toBeGreaterThanOrEqual(2);

    const amountMismatchInc = deal002Inconsistencies.find(
      (inc) => inc.inconsistencyType === 'amount_mismatch'
    );
    const statusMismatchInc = deal002Inconsistencies.find(
      (inc) => inc.inconsistencyType === 'status_mismatch'
    );
    expect(amountMismatchInc).toBeDefined();
    expect(amountMismatchInc?.expectedValue).toBe(500000);
    expect(amountMismatchInc?.actualValue).toBe(400000);
    expect(amountMismatchInc?.differenceAmount).toBe(100000);
    expect(statusMismatchInc).toBeDefined();
    expect(statusMismatchInc?.expectedValue).toContain('受注');
    expect(statusMismatchInc?.actualValue).toContain('キャンセル');

    expect(output.specialInvoiceStatuses).toBeDefined();
    const cancelledInvoice = output.specialInvoiceStatuses.find(
      (si) => si.invoiceId === 'inv-003'
    );
    expect(cancelledInvoice).toBeDefined();
    expect(cancelledInvoice?.status).toBe('cancelled');

    expect(output.transactionHistory).toBeDefined();
    const historyRecords = output.transactionHistory;
    expect(historyRecords.length).toBeGreaterThanOrEqual(4);

    expect(output.notificationContent).toBeDefined();
    expect(output.notificationContent).toContain('データ不整合');
  });
});
