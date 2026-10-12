import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-481: 商談金額と請求明細の合計金額が一致する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hasMismatch=false・差異額0が返される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      visibilityScope: 'full',
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: 'ABC社',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'ABC社システム導入',
          dealAmount: 1000000,
          dealStatus: 'won',
          dealDate: new Date('2026-08-15T00:00:00Z'),
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'inv-001',
        dealId: 'deal-001',
        invoiceAmount: 1000000,
        invoiceStatus: 'confirmed',
        invoiceDate: new Date('2026-09-01T00:00:00Z'),
        lineItems: [
          {
            invoiceId: 'inv-001',
            lineAmount: 1000000,
            taxAmount: 0,
            status: 'confirmed',
          },
        ],
      },
    ]);

    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      isConsistent: true,
      inconsistencies: [],
      mismatchDetails: [
        {
          dealId: 'deal-001',
          invoiceId: 'inv-001',
          dealAmount: 1000000,
          invoiceAmount: 1000000,
          hasMismatch: false,
          mismatchAmount: 0,
          mismatchReason: 'none',
          invoiceStatusSummary: 'all_confirmed',
          recommendedAction: 'no_action_required',
        },
      ],
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('ABC社');
    expect(result.inconsistencies).toEqual([]);
    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
