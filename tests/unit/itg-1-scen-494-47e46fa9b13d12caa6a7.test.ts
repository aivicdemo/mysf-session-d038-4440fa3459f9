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

describe('SCEN-494: 業務ルール：請求明細が存在しないのに商談ステータスが受注の場合、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect unbilled deal warning and include it in inconsistencies', async () => {
    const customerId = 'cust-uuid-12345';
    const loginUserId = 'user-uuid-67890';
    const currentDateTime = new Date('2026-10-15T10:00:00.000Z');

    const dealRecords = [
      {
        dealId: 'deal-uuid-001',
        dealName: 'プロジェクトA',
        dealAmount: 500000,
        stageId: 'stage-won',
        expectedContractDate: '2026-09-01T09:00:00.000Z',
        contractedDate: '2026-09-15T14:30:00.000Z',
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-15T14:30:00.000Z',
        createdBy: 'user-001',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        salesRepresentativeId: 'rep-001',
      },
      {
        dealId: 'deal-uuid-002',
        dealName: 'プロジェクトB',
        dealAmount: 300000,
        stageId: 'stage-won',
        expectedContractDate: '2026-09-20T10:00:00.000Z',
        contractedDate: '2026-10-01T15:00:00.000Z',
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-10-01T15:00:00.000Z',
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
        invoiceId: 'inv-uuid-001',
        dealId: 'deal-uuid-001',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2026-09-16T09:00:00.000Z',
        dueDate: '2026-09-30T09:00:00.000Z',
        invoiceAmount: 500000,
        taxAmount: 50000,
        untaxedAmount: 450000,
        invoiceStatus: 'confirmed',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-09-16T09:00:00.000Z',
        updatedAt: '2026-09-16T09:00:00.000Z',
        createdBy: 'user-001',
      },
    ];

    mockDataPersistence.fetchCustomerWithRelatedRecords.mockResolvedValue({
      customer: {
        customerId,
        customerName: 'テスト顧客',
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
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-01T09:00:00.000Z',
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
      dealId: 'multi-deal',
      isValid: false,
      invoiceIds: ['inv-uuid-001'],
      referenceAnomalies: [
        {
          anomalyType: 'unbilled_deal',
          description: '受注済みですが請求書がまだ作成されていません',
          affectedRecordId: 'deal-uuid-002',
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
    expect(output.inconsistencies).toBeDefined();
    expect(output.inconsistencies.length).toBeGreaterThan(0);

    const unbilledInconsistency = output.inconsistencies.find(
      (inc) => inc.dealId === 'deal-uuid-002'
    );
    expect(unbilledInconsistency).toBeDefined();
    expect(unbilledInconsistency?.inconsistencyType).toBe('unbilled');
    expect(unbilledInconsistency?.reason).toContain('受注済みですが請求書がまだ作成されていません');

    expect(output.notificationContent).toBeDefined();
    expect(output.notificationContent).toContain('受注済みですが請求書がまだ作成されていません');
  });
});
