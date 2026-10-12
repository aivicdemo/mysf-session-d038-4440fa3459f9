import { fetchOperationAuditLogsByRecord, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-885: 操作履歴ログ取得 - データストアエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('操作履歴テーブルの読み取りに失敗した場合、DataStoreErrorが発生', async () => {
    const targetTableName = '商談';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockRejectedValueOnce(
      new Error('DataStore access failed')
    );

    await expect(
      fetchOperationAuditLogsByRecord({
        targetTableName,
        targetRecordId,
      })
    ).rejects.toBeInstanceOf(DataStoreError);
  });
});
