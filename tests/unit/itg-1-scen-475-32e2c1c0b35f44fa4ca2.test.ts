import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-475: 請求レコードのステータスが修正請求の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displayGroup=revised、visualIndicator=orange_markerで分類される', async () => {
    const customerId = 'cust-001';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      restrictions: [],
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: 'テスト顧客A',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'プロジェクトX',
          amount: 1000000,
          stage: 'won',
          closedDate: '2026-09-01',
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
          status: 'revised',
          issueDate: '2026-09-10',
          originalInvoiceId: 'inv-001-orig',
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

    const revisedInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-001'
    );
    expect(revisedInvoice).toBeDefined();
    expect(revisedInvoice?.status).toBe('revised');
    expect(revisedInvoice?.displayGroup).toBe('revised');
    expect(revisedInvoice?.visualIndicator).toBe('orange_marker');
    expect(revisedInvoice?.relatedInvoiceId).toBe('inv-001-orig');
  });
});
