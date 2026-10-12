import { fetchActivitiesByRepresentative, DataStoreError } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1508: 営業活動データ取得のエラーハンドリング', () => {
  const mockDataStore = require('../../src/platform/data-store');

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動テーブルの読み取り処理が DataStoreError で失敗する場合、エラーメッセージ「営業活動データの取得に失敗しました。」を返す', async () => {
    // setup: 営業活動テーブルの読み取り処理が DataStoreError で失敗するようにモック
    const storeError = new DataStoreError('Database connection failed');
    mockDataStore.listRecords.mockRejectedValueOnce(storeError);

    // execute: fetchActivitiesByRepresentative を呼び出し
    await expect(
      fetchActivitiesByRepresentative({
        salesRepresentativeId,
      })
    ).rejects.toThrow('営業活動データの取得に失敗しました。');
  });
});
