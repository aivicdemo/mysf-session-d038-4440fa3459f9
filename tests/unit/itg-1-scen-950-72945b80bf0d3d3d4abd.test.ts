import { fetchSalesTargets } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-950: 営業目標マスタテーブルへのアクセスに失敗した場合、設計済みエラーメッセージを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業目標テーブルへのアクセス処理が DataStoreError で失敗する場合、エラーメッセージを返す', async () => {
    const mockError = new dataStore.DataStoreError('営業目標データの取得に失敗しました。システム管理者に連絡してください。');
    (dataStore.listRecords as jest.Mock).mockRejectedValue(mockError);

    await expect(fetchSalesTargets({})).rejects.toThrow(dataStore.DataStoreError);
    await expect(fetchSalesTargets({})).rejects.toThrow('営業目標データの取得に失敗しました。システム管理者に連絡してください。');
  });
});
