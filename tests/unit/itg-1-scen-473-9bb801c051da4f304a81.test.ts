import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-473: 請求レコードのステータスがキャンセルの場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displayGroup=cancelled、visualIndicator=red_strikethroughで分類される', async () => {
    const customerId = 'cust-12345678-1234-1234-1234-123456789abc';
    const loginUserId = 'user-87654321-4321-4321-4321-987654321fed';
    const currentDateTime = new Date('2026-10-15T14:30:00Z');

    const mockFetchCustomerWithRelatedRecords = {
      customerId,
      customerName: '顧客A',
      deals: [
        {
          dealId: 'deal-111',
          dealName: '契約A',
          dealDate: new Date('2026-09-01T10:00:00Z'),
          dealAmount: 100000,
          stage: '受注',
        },
      ],
      relatedRecords: [],
    };

    const mockFetchInvoicesForPeriod = {
      invoices: [
        {
          invoiceId: 'inv-001',
          dealId: 'deal-111',
          invoiceDate: new Date('2026-09-05T09:00:00Z'),
          amount: 100000,
          status: 'cancelled',
          originalInvoiceId: null,
        },
        {
          invoiceId: 'inv-002',
          dealId: 'deal-111',
          invoiceDate: new Date('2026-09-10T11:00:00Z'),
          amount: 100000,
          status: 'confirmed',
          originalInvoiceId: 'inv-001',
        },
      ],
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
    expect(result.customerName).toBe('顧客A');

    const cancelledInvoice = result.specialInvoiceStatuses.find(
      (s: any) => s.invoiceId === 'inv-001'
    );
    expect(cancelledInvoice).toBeDefined();
    expect(cancelledInvoice?.status).toBe('cancelled');
    expect(cancelledInvoice?.displayGroup).toBe('cancelled');
    expect(cancelledInvoice?.visualIndicator).toBe('red_strikethrough');

    expect(result.inconsistencies).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
