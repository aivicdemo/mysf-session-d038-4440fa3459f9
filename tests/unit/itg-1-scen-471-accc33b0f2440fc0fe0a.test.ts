import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-471: 該当顧客の商談・請求レコードが存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空の商談・請求レコードで警告メッセージが記録される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2024-01-15T10:00:00Z');

    const mockFetchCustomerWithRelatedRecords = {
      customerId,
      customerName: 'テスト顧客A',
      deals: [],
      relatedRecords: [],
    };

    const mockFetchInvoicesForPeriod = {
      invoices: [],
      invoiceDetails: [],
    };

    const mockValidateInvoiceReferenceIntegrity = {
      isConsistent: true,
      inconsistencies: [],
    };

    const mockEnforceAccessControlForDataDisplay = {
      hasAccess: true,
      allowedCustomerIds: [customerId],
    };

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue(
      mockFetchCustomerWithRelatedRecords
    );
    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(
      mockFetchInvoicesForPeriod
    );
    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue(
      mockValidateInvoiceReferenceIntegrity
    );
    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(
      mockEnforceAccessControlForDataDisplay
    );

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('テスト顧客A');
    expect(result.transactionHistory).toEqual([]);
    expect(result.inconsistencies).toEqual([]);
    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toBe('この顧客の商談・請求履歴が見つかりません。');
  });
});
