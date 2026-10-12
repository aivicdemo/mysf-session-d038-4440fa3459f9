import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-482: 商談ステータスが失注または保留の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異理由がキャンセルと判定される', async () => {
    const customerId = 'cust-12345678-1234-1234-1234-123456789012';
    const loginUserId = 'user-87654321-4321-4321-4321-210987654321';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      canAccess: true,
      viewScope: 'full',
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: '取引先B',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'A社新規案件',
          dealAmount: 500000,
          dealStage: '失注',
          dealCreatedDate: new Date('2026-08-01T09:00:00Z'),
          dealUpdatedDate: new Date('2026-09-15T14:30:00Z'),
          lossReason: null,
        },
        {
          dealId: 'deal-002',
          dealName: 'B社保留案件',
          dealAmount: 300000,
          dealStage: '保留',
          dealCreatedDate: new Date('2026-08-10T10:00:00Z'),
          dealUpdatedDate: new Date('2026-09-20T11:00:00Z'),
          lossReason: null,
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-001',
          dealId: 'deal-001',
          invoiceAmount: 500000,
          invoiceStatus: 'issued',
          invoiceDate: new Date('2026-08-15T00:00:00Z'),
          revisedCount: 0,
        },
        {
          invoiceId: 'inv-002',
          dealId: 'deal-002',
          invoiceAmount: 0,
          invoiceStatus: 'cancelled',
          invoiceDate: new Date('2026-08-20T00:00:00Z'),
          revisedCount: 0,
        },
      ],
      invoiceDetails: [],
    });

    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      mismatchList: [],
      validationPassed: true,
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);

    const cancelledInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-002'
    );
    expect(cancelledInvoice).toBeDefined();
    expect(cancelledInvoice?.displayGroup).toBe('cancelled');
    expect(cancelledInvoice?.visualIndicator).toBe('red_strikethrough');

    expect(result.inconsistencies).toEqual([]);
  });
});
