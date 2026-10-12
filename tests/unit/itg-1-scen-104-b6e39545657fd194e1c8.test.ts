import { validateInvoiceReferenceIntegrity, InvoiceWithoutLineItems } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
}));

describe('SCEN-104: 請求書は存在するが、その請求書に紐付く請求明細が1件も存在しない場合、InvoiceWithoutLineItems エラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求書が存在するが、fetchInvoiceLineItemsByInvoice が空配列を返す場合、InvoiceWithoutLineItems エラーが発生する', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealAmount: 100000,
      dealStatus: 'closed_won',
    };

    const mockInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 100000,
        invoiceStatus: 'issued',
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(
      mockDealData
    );
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(
      mockInvoices
    );
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(
      []
    );

    await expect(
      validateInvoiceReferenceIntegrity({ dealId })
    ).rejects.toThrow(InvoiceWithoutLineItems);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoiceLineItemsByInvoice).toHaveBeenCalledWith(
      'inv-001'
    );
  });
});
