import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-479: ステータス値が定義されていない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('警告メッセージが記録される', async () => {
    const customerId = 'cust-12345';
    const loginUserId = 'user-67890';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      isAccessible: true,
      allowedViewScope: '全データ',
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: 'テスト顧客A',
      deals: [
        {
          dealId: 'deal-001',
          dealName: '案件1',
          amount: 100000,
          stage: '受注',
          dealDate: new Date('2026-09-01T09:00:00Z'),
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-001',
          dealId: 'deal-001',
          amount: 100000,
          status: 'cancelled',
          invoiceDate: new Date('2026-09-10T14:00:00Z'),
          originalInvoiceId: null,
        },
        {
          invoiceId: 'inv-002',
          dealId: 'deal-001',
          amount: 100000,
          status: '未定義ステータス値',
          invoiceDate: new Date('2026-09-15T10:00:00Z'),
          originalInvoiceId: null,
        },
      ],
      invoiceDetails: [],
    });

    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      isValid: true,
      inconsistencies: [],
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('テスト顧客A');
    expect(result.notificationContent).toContain('ステータス値の定義を確認してください');

    const cancelledInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-001'
    );
    expect(cancelledInvoice).toBeDefined();
  });
});
