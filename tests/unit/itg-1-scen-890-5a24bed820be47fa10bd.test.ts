import { fetchOperationAuditLogsByUser, NoOperationLogsFoundError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-890: fetchOperationAuditLogsByUser - 操作履歴が1件も存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定ユーザーが実施した操作履歴が1件も存在しない場合、NoOperationLogsFoundErrorが発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(
      fetchOperationAuditLogsByUser({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow(NoOperationLogsFoundError);

    await expect(
      fetchOperationAuditLogsByUser({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow('このユーザーの操作履歴は存在しません。');
  });
});
