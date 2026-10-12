import { fetchInvoiceLineItemsByInvoice, InvoiceNotFound } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-812: 請求書が存在しない場合、InvoiceNotFoundエラーが発生', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceNotFound error when invoice does not exist', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockResolvedValue([]);

    await expect(fetchInvoiceLineItemsByInvoice({ invoiceId })).rejects.toThrow(InvoiceNotFound);
    await expect(fetchInvoiceLineItemsByInvoice({ invoiceId })).rejects.toThrow('指定された請求書が見つかりません。');
  });
});
