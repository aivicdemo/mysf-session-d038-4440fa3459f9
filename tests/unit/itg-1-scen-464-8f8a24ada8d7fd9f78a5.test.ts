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

describe('SCEN-464: 業務ルール：商談と請求を時系列で統合し、各レコードが作成日時の昇順でソートされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate deals and invoices in chronological order by date', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      loginUserId: 'user-12345',
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: 'テスト顧客A',
      deals: [
        {
          dealId: 'deal-001',
          dealName: '商談A',
          amount: 100000,
          stage: '受注',
          createdDate: new Date('2026-09-01T09:00:00Z'),
          invoiceId: undefined,
        },
        {
          dealId: 'deal-002',
          dealName: '商談B',
          amount: 150000,
          stage: '受注',
          createdDate: new Date('2026-09-10T10:00:00Z'),
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
          amount: 100000,
          status: '発行済',
          invoiceDate: new Date('2026-09-06T11:00:00Z'),
          revisedCount: 0,
        },
        {
          invoiceId: 'inv-002',
          invoiceNumber: 'inv-002',
          dealId: 'deal-002',
          amount: 150000,
          status: '発行済',
          invoiceDate: new Date('2026-09-16T12:00:00Z'),
          revisedCount: 0,
        },
      ],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      isValid: true,
      inconsistencies: [],
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      hasAccess: true,
      accessLevel: 'full',
    });

    const result = await displayCustomerTransactionHistory(input);

    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerName).toBe('テスト顧客A');
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory.length).toBeGreaterThan(0);

    // verify records are in chronological order
    for (let i = 1; i < result.transactionHistory.length; i++) {
      const prevDate = new Date(result.transactionHistory[i - 1].date).getTime();
      const currDate = new Date(result.transactionHistory[i].date).getTime();
      expect(prevDate).toBeLessThanOrEqual(currDate);
    }

    expect(result.inconsistencies).toEqual([]);
    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
