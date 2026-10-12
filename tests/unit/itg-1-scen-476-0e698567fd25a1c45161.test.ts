import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-476: キャンセル・返金・修正請求レコードが元請求IDを持つ場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('関連請求IDが正しく設定される', async () => {
    const customerId = 'cust-001';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      restrictions: [],
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: 'ABC商事',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'プロジェクトX',
          dealAmount: 1000000,
          dealStatus: '受注',
          createdAt: new Date('2026-08-01T09:00:00Z'),
          updatedAt: new Date('2026-08-15T14:30:00Z'),
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-001',
          dealId: 'deal-001',
          amount: 1000000,
          status: '発行済',
          invoiceDate: new Date('2026-08-20T10:00:00Z'),
        },
        {
          invoiceId: 'inv-002',
          dealId: 'deal-001',
          amount: 500000,
          status: '修正請求',
          invoiceDate: new Date('2026-09-10T11:00:00Z'),
          originalInvoiceId: 'inv-001',
        },
        {
          invoiceId: 'inv-003',
          dealId: 'deal-001',
          amount: 300000,
          status: '返金',
          invoiceDate: new Date('2026-09-15T12:00:00Z'),
          originalInvoiceId: 'inv-001',
        },
      ],
      invoiceDetails: [],
    });

    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      inconsistencies: [],
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('ABC商事');

    const revisedInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-002'
    );
    expect(revisedInvoice).toBeDefined();
    expect(revisedInvoice?.relatedInvoiceId).toBe('inv-001');
    expect(revisedInvoice?.displayGroup).toBe('revised');

    const refundedInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-003'
    );
    expect(refundedInvoice).toBeDefined();
    expect(refundedInvoice?.relatedInvoiceId).toBe('inv-001');
    expect(refundedInvoice?.displayGroup).toBe('refunded');

    expect(result.inconsistencies).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
