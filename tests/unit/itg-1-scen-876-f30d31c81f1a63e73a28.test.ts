import { fetchAllUsers, DataStoreError, type FetchAllUsersInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-876: ユーザーテーブルへのアクセスに失敗した場合、DataStoreErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with specific message when user table access fails', async () => {
    // Setup precondition: ユーザーテーブルの全レコード = 読み書きが DataStoreError で失敗する
    mockDataStore.listRecords.mockRejectedValue(new Error('Data store access failed'));

    // Call fetchAllUsers
    await expect(fetchAllUsers({})).rejects.toThrow(DataStoreError);
    await expect(fetchAllUsers({})).rejects.toThrow('ユーザーレコードの取得に失敗しました。');
  });
});
