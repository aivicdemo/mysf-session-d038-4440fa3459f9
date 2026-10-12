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

describe('SCEN-468: 業務ルール：商談ステータスと請求書ステータスが整合しない場合、「ステータス不整合」として不整合リストに追加される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add status mismatch to inconsistencies when deal and invoice statuses do not align', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: 'cust-001',
      loginUserId: 'user-sales-001',
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: 'cust-001',
      customerName: 'ABC株式会社',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'システム導入案件',
          amount: 1000000,
          stage: 'won',
          createdDate: new Date('2026-05-01T09:00:00Z'),
          invoiceId: undefined,
        },
        {
          dealId: 'deal-002',
          dealName: '保守契約',
          amount: 500000,
          stage: 'won',
          createdDate: new Date('2026-07-01T10:00:00Z'),
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
          status: 'issued',
          invoiceDate: new Date('2026-06-15T14:30:00Z'),
          originalInvoiceId: null,
        },
        {
          invoiceId: 'inv-002',
          invoiceNumber: 'inv-002',
          dealId: 'deal-002',
          amount: 500000,
          status: 'issued',
          invoiceDate: new Date('2026-08-20T16:45:00Z'),
          originalInvoiceId: null,
        },
      ],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      isValid: false,
      inconsistencies: [
        {
          type: 'statusMismatch',
          dealId: 'deal-001',
          invoiceId: 'inv-001',
          dealStatus: 'won',
          invoiceStatus: 'issued',
          description: '商談ステータスが受注、請求書ステータスが発行済だが、商談金額1000000と請求金額900000の差異がステータス不整合として分類される',
        },
      ],
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
    });

    const result = await displayCustomerTransactionHistory(input);

    expect(result.customerId).toBe('cust-001');
    expect(result.transactionHistory).toBeDefined();
    expect(result.inconsistencies.length).toBeGreaterThan(0);

    const statusMismatch = result.inconsistencies.find((inc) => inc.inconsistencyType === 'status_mismatch');
    expect(statusMismatch).toBeDefined();
    expect(statusMismatch?.dealId).toBe('deal-001');
    expect(statusMismatch?.invoiceId).toBe('inv-001');
    expect(statusMismatch?.expectedValue).toEqual('won');
    expect(statusMismatch?.actualValue).toEqual('issued');

    expect(result.notificationContent).toBeDefined();
  });
});
