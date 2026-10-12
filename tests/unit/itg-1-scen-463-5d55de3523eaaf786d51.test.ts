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

describe('SCEN-463: 業務ルール：営業担当者IDが空または不正な場合、「営業担当者情報が確認できません。管理者に連絡してください」警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record warning in notificationContent when salesPersonId is empty', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      loginUserId: 'user-12345',
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: 'テスト顧客A',
      deals: [
        {
          dealId: 'deal-001',
          dealName: '契約案件1',
          amount: 1000000,
          stage: '受注',
          createdDate: new Date('2026-01-15'),
          invoiceId: undefined,
          salesPersonId: '',
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
          amount: 1000000,
          status: '発行済',
          invoiceDate: new Date('2026-02-01'),
        },
      ],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      isConsistent: true,
      inconsistencies: [],
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      hasAccess: true,
      accessLevel: 'full',
    });

    const result = await displayCustomerTransactionHistory(input);

    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerName).toBe('テスト顧客A');
    expect(result.notificationContent).toContain('営業担当者情報が確認できません。管理者に連絡してください');
    expect(result.transactionHistory).toBeDefined();
    expect(result.inconsistencies).toEqual([]);
  });
});
