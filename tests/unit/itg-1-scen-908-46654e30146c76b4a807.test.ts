import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-908: 検索条件に合致する操作ログが0件の場合、空の配列と総件数0が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array and totalCount 0 when no logs match conditions', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2026-01-15T10:00:00Z',
      periodEndDateTime: '2026-01-15T12:00:00Z',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    });

    expect(result.operationLogs).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
