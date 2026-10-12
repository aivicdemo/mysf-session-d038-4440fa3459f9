import { fetchInvoiceById, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-835: fetchInvoiceById - DataStoreError on system failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with correct message when data store read fails', async () => {
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new Error('請求書データの取得に失敗しました。しばらく後に再度お試しください。')
    );

    await expect(fetchInvoiceById({ invoiceId })).rejects.toThrow();
    await expect(fetchInvoiceById({ invoiceId })).rejects.toThrow(
      '請求書データの取得に失敗しました。しばらく後に再度お試しください。'
    );
  });
});
