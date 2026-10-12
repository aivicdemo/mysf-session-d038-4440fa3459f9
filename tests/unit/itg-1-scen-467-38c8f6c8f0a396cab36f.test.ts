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

describe('SCEN-467: 業務ルール：商談金額と請求金額が一致しない場合、「金額ズレ」として不整合リストに追加される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add amount mismatch to inconsistencies when deal and invoice amounts differ', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: 'cust-uuid-12345',
      loginUserId: 'user-uuid-67890',
      currentDateTime: new Date('2024-01-15T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: 'cust-uuid-12345',
      customerName: '株式会社テスト',
      deals: [
        {
          dealId: 'deal-001',
          dealName: '案件A',
          amount: 1000000,
          stage: '受注',
          createdDate: new Date('2024-01-01T09:00:00Z'),
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
          amount: 900000,
          status: '発行済',
          invoiceDate: new Date('2024-01-05T10:00:00Z'),
        },
      ],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      inconsistencies: [
        {
          type: '金額ズレ',
          dealId: 'deal-001',
          invoiceId: 'inv-001',
          dealAmount: 1000000,
          invoiceAmount: 900000,
          mismatchAmount: 100000,
          severity: 'warning',
        },
      ],
      hasInconsistencies: true,
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      hasAccess: true,
      accessLevel: 'full',
    });

    const result = await displayCustomerTransactionHistory(input);

    expect(result.customerId).toBe('cust-uuid-12345');
    expect(result.customerName).toBe('株式会社テスト');
    expect(result.transactionHistory).toBeDefined();
    expect(result.inconsistencies.length).toBeGreaterThan(0);

    const amountMismatch = result.inconsistencies.find((inc) => inc.inconsistencyType === 'amount_mismatch');
    expect(amountMismatch).toBeDefined();
    expect(amountMismatch?.dealId).toBe('deal-001');
    expect(amountMismatch?.invoiceId).toBe('inv-001');
    expect(amountMismatch?.expectedValue).toEqual(1000000);
    expect(amountMismatch?.actualValue).toEqual(900000);
    expect(amountMismatch?.differenceAmount).toEqual(100000);
    expect(amountMismatch?.severity).toBe('medium');

    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toContain('データ不整合が検出されました');
  });
});
