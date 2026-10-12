import { fetchOperationAuditLogsByUser, UserNotFoundError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-889: fetchOperationAuditLogsByUser - ユーザーが見つからない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたユーザーIDが存在しない場合、UserNotFoundErrorが発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(
      fetchOperationAuditLogsByUser({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow(UserNotFoundError);

    await expect(
      fetchOperationAuditLogsByUser({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow('指定されたユーザーが見つかりません。');
  });
});
