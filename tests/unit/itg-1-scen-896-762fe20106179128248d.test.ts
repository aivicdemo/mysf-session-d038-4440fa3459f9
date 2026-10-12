import { fetchOperationAuditLogsByPeriod, InvalidPeriodError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { FetchOperationAuditLogsByPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-896: 期間開始日時が終了日時以降または同一の場合、期間順序エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidPeriodError when periodStartDateTime equals periodEndDateTime', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: FetchOperationAuditLogsByPeriodInput = {
      periodStartDateTime: '2026-01-15T10:00:00Z',
      periodEndDateTime: '2026-01-15T10:00:00Z',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    };

    await expect(fetchOperationAuditLogsByPeriod(input)).rejects.toThrow(InvalidPeriodError);
    await expect(fetchOperationAuditLogsByPeriod(input)).rejects.toThrow(
      '期間の開始日時は終了日時より前である必要があります。'
    );
  });
});
