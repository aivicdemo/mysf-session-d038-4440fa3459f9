import { fetchAllDealStages, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-849: 商談ステージマスタテーブルへのアクセスに失敗したとき、設計済みエラーが発生する', () => {
  it('DataStoreError がスロー され、エラー文言が「商談ステージマスタの取得に失敗しました。システム管理者に連絡してください。」である', async () => {
    const error = new dataStore.DataStoreError('商談ステージマスタの取得に失敗しました。システム管理者に連絡してください.');
    (dataStore.listRecords as jest.Mock).mockRejectedValueOnce(error);

    await expect(fetchAllDealStages({} as any)).rejects.toThrow(DataStoreError);
    await expect(fetchAllDealStages({} as any)).rejects.toThrow('商談ステージマスタの取得に失敗しました。システム管理者に連絡してください.');
  });
});
