import { validateInvoiceReferenceIntegrity, InvoiceLineItemDealMismatch } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-106: 請求明細のdeal_idが指定されたdealIdと一致しない場合、InvoiceLineItemDealMismatchエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求明細のdeal_idが指定されたdealIdと一致しない場合、InvoiceLineItemDealMismatch エラーがスローされる', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: 'cust-001',
      dealAmount: 100000,
      dealStatus: 'won',
    };

    const mockInvoiceRecords = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: 'cust-001',
        invoiceAmount: 100000,
        invoiceStatus: 'issued',
      },
    ];

    const mockInvoiceLineItemRecords = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        lineAmount: 50000,
        productId: 'prod-A',
      },
      {
        invoiceId: 'inv-001',
        dealId: '999e8400-e29b-41d4-a716-446655440999',
        lineAmount: 50000,
        productId: 'prod-B',
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoiceRecords);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(mockInvoiceLineItemRecords);

    await expect(validateInvoiceReferenceIntegrity({ dealId })).rejects.toThrow(InvoiceLineItemDealMismatch);
  });
});
