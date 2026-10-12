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

describe('SCEN-496: データ不整合が検出された場合、notificationContentに不整合の詳細メッセージが格納される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include detailed inconsistency message in notificationContent', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

    const dealRecords = [
      {
        dealId: 'deal-001',
        dealName: '案件001',
        dealAmount: 1000000,
        stageId: 'stage-won',
        expectedContractDate: '2026-08-01T00:00:00Z',
        contractedDate: '2026-08-15T00:00:00Z',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-15T00:00:00Z',
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
        invoiceDate: '2026-08-20T00:00:00Z',
        dueDate: '2026-09-10T00:00:00Z',
        invoiceAmount: 950000,
        taxAmount: 95000,
        untaxedAmount: 855000,
        invoiceStatus: '発行済',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-08-20T00:00:00Z',
        updatedAt: '2026-08-20T00:00:00Z',
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
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
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
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockDealInvoiceReconciliation.validateInvoiceReferenceIntegrity.mockResolvedValue({
      dealId: 'deal-001',
      isValid: false,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amount_mismatch',
          description: '商談金額と請求金額に差異があります',
          affectedRecordId: 'deal-001',
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
    expect(output.inconsistencies.length).toBeGreaterThan(0);

    const amountMismatchInc = output.inconsistencies.find(
      (inc) => inc.inconsistencyType === 'amount_mismatch' && inc.dealId === 'deal-001'
    );
    expect(amountMismatchInc).toBeDefined();
    expect(amountMismatchInc?.expectedValue).toBe(1000000);
    expect(amountMismatchInc?.actualValue).toBe(950000);
    expect(amountMismatchInc?.differenceAmount).toBe(50000);
    expect(amountMismatchInc?.reason).toContain('部分請求');
    expect(amountMismatchInc?.invoiceId).toBe('inv-001');

    expect(output.notificationContent).toBeDefined();
    expect(output.notificationContent).not.toBeNull();
    expect(output.notificationContent).toMatch(/deal-001.*inv-001.*1000000.*950000.*50000.*部分請求/);
    expect(output.notificationContent).toContain('商談');
    expect(output.notificationContent).toContain('請求');
    expect(output.notificationContent).toContain('金額');

    expect(output.transactionHistory).toBeDefined();
    expect(output.specialInvoiceStatuses).toBeDefined();
  });
});
