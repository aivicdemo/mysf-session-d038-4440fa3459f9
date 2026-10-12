import { fetchAllSalesRepresentatives, DataStoreError } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-846: 営業担当者テーブルへのアクセスに失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with correct message when data store access fails', async () => {
    const mockError = new Error('Data store operation failed');
    (DataStore.listRecords as jest.Mock).mockRejectedValue(mockError);

    await expect(fetchAllSalesRepresentatives({})).rejects.toThrow(DataStoreError);
    await expect(fetchAllSalesRepresentatives({})).rejects.toThrow(
      '営業担当者マスタの取得に失敗しました。システム管理者に連絡してください。'
    );
  });
});
