import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-480: 修正請求の元請求IDが存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('警告メッセージが記録される', async () => {
    const customerId = 'cust-001';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      restrictedFields: [],
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: '取引先A',
      dealRecords: [
        {
          dealId: 'deal-001',
          dealName: '商談001',
          dealAmount: 100000,
          dealStatus: '受注',
          dealDate: new Date('2026-09-01T00:00:00Z'),
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoiceRecords: [
        {
          invoiceId: 'inv-001',
          dealId: 'deal-001',
          invoiceDate: new Date('2026-09-10T00:00:00Z'),
          amount: 100000,
          status: '発行済',
        },
        {
          invoiceId: 'inv-002',
          dealId: null,
          invoiceDate: new Date('2026-09-15T00:00:00Z'),
          amount: 50000,
          status: '修正請求',
          originalInvoiceId: 'inv-999',
        },
      ],
    });

    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      isValid: false,
      inconsistencies: [
        {
          invoiceId: 'inv-002',
          originalInvoiceId: 'inv-999',
          message: '元の請求レコードが見つかりません。関連付けを確認してください',
        },
      ],
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('取引先A');
    expect(result.inconsistencies.length).toBeGreaterThan(0);

    const foundInconsistency = result.inconsistencies.find(
      (i: any) => i.invoiceId === 'inv-002' && i.originalInvoiceId === 'inv-999'
    );
    expect(foundInconsistency).toBeDefined();
    expect(foundInconsistency?.message).toContain('元の請求レコードが見つかりません');

    expect(result.notificationContent).toContain('元の請求レコードが見つかりません');
  });
});
