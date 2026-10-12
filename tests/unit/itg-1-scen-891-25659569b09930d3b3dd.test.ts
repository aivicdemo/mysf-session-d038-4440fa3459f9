import { fetchOperationAuditLogsByUser, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-891: fetchOperationAuditLogsByUser - データストアアクセス失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('操作履歴テーブルへのアクセスに失敗した場合、DataStoreErrorが発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('操作履歴の取得に失敗しました。')
    );

    await expect(
      fetchOperationAuditLogsByUser({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow(DataStoreError);

    await expect(
      fetchOperationAuditLogsByUser({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow('操作履歴の取得に失敗しました。');
  });
});
