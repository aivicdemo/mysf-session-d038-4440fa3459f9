import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-474: 請求レコードのステータスが返金の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displayGroup=refunded、visualIndicator=blue_badgeで分類される', async () => {
    const customerId = 'cust-uuid-12345';
    const loginUserId = 'user-uuid-67890';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      visibilityScope: 'full',
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: '顧客A',
      deals: [
        {
          dealId: 'deal-001',
          dealName: '商談A',
          amount: 100000,
          stage: 'won',
          createdDate: new Date('2026-09-01T00:00:00Z'),
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
          status: 'refunded',
          invoiceDate: new Date('2026-09-05T00:00:00Z'),
          originalInvoiceId: 'inv-orig-001',
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

    const refundedInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-001'
    );
    expect(refundedInvoice).toBeDefined();
    expect(refundedInvoice?.status).toBe('refunded');
    expect(refundedInvoice?.displayGroup).toBe('refunded');
    expect(refundedInvoice?.visualIndicator).toBe('blue_badge');
    expect(refundedInvoice?.relatedInvoiceId).toBe('inv-orig-001');
  });
});
