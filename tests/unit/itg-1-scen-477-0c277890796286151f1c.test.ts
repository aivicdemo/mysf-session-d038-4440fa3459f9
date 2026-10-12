import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-477: 分類済みレコードが表示グループの優先順位で整列される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通常→キャンセル→返金→修正の順で整列される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      restrictionLevel: 'none',
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: '株式会社テスト',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'A商談',
          dealDate: new Date('2026-08-01T09:00:00Z'),
          dealAmount: 1000000,
          status: 'won',
          createdAt: new Date('2026-08-01T09:00:00Z'),
          updatedAt: new Date('2026-08-15T14:00:00Z'),
        },
        {
          dealId: 'deal-002',
          dealName: 'B商談',
          dealDate: new Date('2026-09-10T10:00:00Z'),
          dealAmount: 500000,
          status: 'won',
          createdAt: new Date('2026-09-10T10:00:00Z'),
          updatedAt: new Date('2026-09-20T11:30:00Z'),
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-001',
          dealId: 'deal-001',
          invoiceDate: new Date('2026-08-20T09:00:00Z'),
          amount: 1000000,
          status: 'issued',
          revisedCount: 0,
          reissuedCount: 0,
        },
        {
          invoiceId: 'inv-002',
          dealId: 'deal-001',
          invoiceDate: new Date('2026-09-05T14:00:00Z'),
          amount: 0,
          status: 'cancelled',
          originalInvoiceId: 'inv-001',
          revisedCount: 0,
          reissuedCount: 0,
        },
        {
          invoiceId: 'inv-003',
          dealId: 'deal-002',
          invoiceDate: new Date('2026-09-25T09:00:00Z'),
          amount: 500000,
          status: 'issued',
          revisedCount: 0,
          reissuedCount: 0,
        },
        {
          invoiceId: 'inv-004',
          dealId: 'deal-002',
          invoiceDate: new Date('2026-10-05T10:00:00Z'),
          amount: 500000,
          status: 'revised',
          originalInvoiceId: 'inv-003',
          revisedCount: 1,
          reissuedCount: 0,
        },
        {
          invoiceId: 'inv-005',
          dealId: 'deal-002',
          invoiceDate: new Date('2026-10-10T15:00:00Z'),
          amount: 250000,
          status: 'refunded',
          originalInvoiceId: 'inv-003',
          revisedCount: 0,
          reissuedCount: 0,
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
    expect(result.customerName).toBe('株式会社テスト');

    const specialInvoices = result.specialInvoiceStatuses;
    expect(specialInvoices).toHaveLength(3);

    expect(specialInvoices[0].invoiceId).toBe('inv-002');
    expect(specialInvoices[0].displayGroup).toBe('cancelled');
    expect(specialInvoices[0].displayOrder).toBe(1);

    expect(specialInvoices[1].invoiceId).toBe('inv-005');
    expect(specialInvoices[1].displayGroup).toBe('refunded');
    expect(specialInvoices[1].displayOrder).toBe(2);

    expect(specialInvoices[2].invoiceId).toBe('inv-004');
    expect(specialInvoices[2].displayGroup).toBe('revised');
    expect(specialInvoices[2].displayOrder).toBe(3);

    expect(result.inconsistencies).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
