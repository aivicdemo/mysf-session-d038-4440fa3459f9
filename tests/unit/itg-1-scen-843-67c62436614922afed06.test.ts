import { fetchAllCustomers, DataStoreError } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-843: 取引先テーブルへのアクセスに失敗したとき、設計済みエラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with correct message when data store access fails', async () => {
    const mockError = new Error('Data store operation failed');
    (DataStore.listRecords as jest.Mock).mockRejectedValue(mockError);

    await expect(fetchAllCustomers({})).rejects.toThrow(DataStoreError);
    await expect(fetchAllCustomers({})).rejects.toThrow(
      '取引先データの取得に失敗しました。'
    );
  });
});
