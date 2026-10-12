import { fetchAllActivityTypes, DataStoreError, FetchAllActivityTypesInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-856: 活動タイプマスタテーブルへのアクセスに失敗した場合', () => {
  it('DataStoreError が発生し、エラー文言が「活動タイプマスタの取得に失敗しました。」である', async () => {
    const dataStore = require('../../src/platform/data-store');
    const error = new DataStoreError('活動タイプマスタの取得に失敗しました。');
    dataStore.listRecords = jest.fn().mockRejectedValue(error);

    const input: FetchAllActivityTypesInput = {};

    await expect(fetchAllActivityTypes(input)).rejects.toThrow('活動タイプマスタの取得に失敗しました。');
  });
});
