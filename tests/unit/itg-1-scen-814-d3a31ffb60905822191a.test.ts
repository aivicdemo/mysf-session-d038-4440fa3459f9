import { fetchInvoiceLineItemsByInvoice, DataStoreError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-814: データ読み取りに失敗した場合、DataStoreErrorが発生', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store fails to read', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockRejectedValue(
      new DataStoreError('請求明細の取得に失敗しました。')
    );

    await expect(fetchInvoiceLineItemsByInvoice({ invoiceId })).rejects.toThrow(DataStoreError);
    await expect(fetchInvoiceLineItemsByInvoice({ invoiceId })).rejects.toThrow('請求明細の取得に失敗しました。');
  });
});
