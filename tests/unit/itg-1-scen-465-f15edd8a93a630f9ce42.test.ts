import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  displayCustomerTransactionHistory,
  DisplayCustomerTransactionHistoryInput,
  TransactionInconsistency,
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

describe('SCEN-465: 業務ルール：商談に対応する請求書が存在しない場合、「未請求」として不整合リストに追加される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add unbilled deal to inconsistencies when invoice does not exist', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      loginUserId: 'user-001',
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: 'テスト顧客',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'A社システム導入案件',
          amount: 5000000,
          stage: '受注',
          createdDate: new Date('2026-09-01T09:00:00Z'),
          invoiceId: undefined,
        },
        {
          dealId: 'deal-002',
          dealName: 'B社保守契約',
          amount: 1500000,
          stage: '受注',
          createdDate: new Date('2026-08-01T10:00:00Z'),
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
          dealId: 'deal-002',
          amount: 1500000,
          status: '発行済',
          invoiceDate: new Date('2026-08-25T09:00:00Z'),
        },
      ],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      inconsistencies: [
        {
          type: '未請求',
          dealId: 'deal-001',
          dealAmount: 5000000,
          invoiceAmount: 0,
          message: '商談deal-001に対応する請求書が存在しません',
        },
      ],
      isValid: false,
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      isAuthorized: true,
      accessLevel: 'full_customer_view',
    });

    const result = await displayCustomerTransactionHistory(input);

    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.transactionHistory).toBeDefined();
    expect(result.inconsistencies.length).toBeGreaterThan(0);

    const unbilledInconsistency = result.inconsistencies.find((inc) => inc.inconsistencyType === 'unbilled');
    expect(unbilledInconsistency).toBeDefined();
    expect(unbilledInconsistency?.dealId).toBe('deal-001');
    expect(unbilledInconsistency?.expectedValue).toEqual(5000000);
    expect(unbilledInconsistency?.actualValue).toEqual(0);

    expect(result.notificationContent).toContain('未請求');
  });
});
