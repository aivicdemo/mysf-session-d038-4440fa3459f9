import { fetchUserPermissions, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-882: ユーザー権限取得 - データストアエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザー権限テーブルの読み取りに失敗した場合、DataStoreErrorが発生', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockRejectedValueOnce(
      new Error('DataStore access failed')
    );

    await expect(
      fetchUserPermissions({ userId })
    ).rejects.toBeInstanceOf(DataStoreError);
  });
});
