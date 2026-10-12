import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  displayCustomerTransactionHistory,
  DisplayCustomerTransactionHistoryInput,
} from '../../src/logic/customer-transaction-history';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';
import * as accessControl from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchCustomerWithRelatedRecords: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
}));
jest.mock('../../src/logic/deal-invoice-reconciliation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/deal-invoice-reconciliation')>('../../src/logic/deal-invoice-reconciliation'),
  validateInvoiceReferenceIntegrity: jest.fn(),
}));
jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/access-control-enforcement')>('../../src/logic/access-control-enforcement'),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

describe('SCEN-466: 業務ルール：請求書に対応する商談が存在しない場合、「孤立請求書」として不整合リストに追加される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add orphan invoice to inconsistencies when related deal does not exist', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: 'cust-uuid-001',
      loginUserId: 'user-uuid-sales-001',
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: 'cust-uuid-001',
      customerName: 'テスト顧客',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'システム導入プロジェクト',
          amount: 500000,
          stage: '受注',
          createdDate: new Date('2026-09-01'),
          invoiceId: undefined,
        },
        {
          dealId: 'deal-002',
          dealName: '保守契約更新',
          amount: 200000,
          stage: '受注',
          createdDate: new Date('2026-08-01'),
          invoiceId: undefined,
        },
      ],
      invoices: [],
      invoiceLineItems: [],
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-001',
          invoiceNumber: 'inv-001',
          dealId: 'deal-001',
          amount: 500000,
          status: '発行済',
          invoiceDate: new Date('2026-09-16'),
          revisionCount: 0,
        },
        {
          invoiceId: 'inv-999',
          invoiceNumber: 'inv-999',
          dealId: null,
          amount: 150000,
          status: '発行済',
          invoiceDate: new Date('2026-09-10'),
          revisionCount: 0,
        },
      ],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      integrityIssues: [
        {
          type: 'orphanInvoice',
          invoiceId: 'inv-999',
          dealId: null,
          description: '請求書inv-999に対応する商談が存在しない',
        },
      ],
      hasInconsistencies: true,
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      hasAccess: true,
      allowedCustomerIds: ['cust-uuid-001', 'cust-uuid-002'],
    });

    const result = await displayCustomerTransactionHistory(input);

    expect(result.customerId).toBe('cust-uuid-001');
    expect(result.transactionHistory).toBeDefined();
    expect(result.inconsistencies.length).toBeGreaterThan(0);

    const orphanInconsistency = result.inconsistencies.find((inc) => inc.inconsistencyType === 'reference_broken');
    expect(orphanInconsistency).toBeDefined();
    expect(orphanInconsistency?.invoiceId).toBe('inv-999');

    expect(result.notificationContent).toContain('孤立請求書');
  });
});
