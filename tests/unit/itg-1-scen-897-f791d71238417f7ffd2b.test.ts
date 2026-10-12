import { fetchOperationAuditLogsByPeriod, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { FetchOperationAuditLogsByPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-897: 操作履歴テーブルへのアクセスに失敗した場合、データアクセスエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when accessing operation history table fails', async () => {
    const error = new Error('Database access failed');
    (dataStore.listRecords as jest.Mock).mockRejectedValue(error);

    const input: FetchOperationAuditLogsByPeriodInput = {
      periodStartDateTime: '2026-01-01T00:00:00Z',
      periodEndDateTime: '2026-01-31T23:59:59Z',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    };

    await expect(fetchOperationAuditLogsByPeriod(input)).rejects.toThrow(DataStoreError);
    await expect(fetchOperationAuditLogsByPeriod(input)).rejects.toThrow(
      '操作履歴データの取得に失敗しました。'
    );
  });
});
