import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  displayCustomerTransactionHistory,
  DataInconsistencyDetected,
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

describe('SCEN-462: 業務ルール：商談IDが空または不正な場合、「有効な商談を選択してください」例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataInconsistencyDetected when deal records are empty and cannot be validated', async () => {
    const input: DisplayCustomerTransactionHistoryInput = {
      customerId: 'CUST-001',
      loginUserId: 'USER-001',
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
    };

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock<any>).mockResolvedValue({
      customerId: 'CUST-001',
      customerName: 'テスト顧客',
      deals: [],
      invoices: [],
      invoiceLineItems: [],
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue({
      invoices: [],
    });

    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock<any>).mockResolvedValue({
      hasInconsistencies: false,
      inconsistencies: [],
    });

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock<any>).mockResolvedValue({
      hasAccess: true,
      displayRangeRestriction: null,
    });

    await expect(displayCustomerTransactionHistory(input)).rejects.toThrow(DataInconsistencyDetected);
  });
});
