import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { FetchOperationAuditLogsByPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-895: 指定期間内の操作ログを操作実行日時の降順で取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch operation logs within period sorted by execution timestamp in descending order', async () => {
    const mockRecords = [
      {
        operationAuditLogId: 'aud-001',
        userId: 'user-001',
        operationType: 'CREATE',
        targetTableName: '取引先',
        targetRecordId: 'rec-001',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"テスト会社A"}',
        operationDetailContent: '取引先レコード作成',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T14:30:00Z',
        id: 'id-001',
        createdAt: '2024-01-15T14:30:01Z',
        updatedAt: '2024-01-15T14:30:01Z',
      },
      {
        operationAuditLogId: 'aud-002',
        userId: 'user-002',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: 'rec-002',
        changeBeforeValue: '{"status":"OPEN"}',
        changeAfterValue: '{"status":"CLOSED_WON"}',
        operationDetailContent: '商談ステータス更新',
        ipAddress: '192.168.1.2',
        sessionId: 'sess-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T10:15:30Z',
        id: 'id-002',
        createdAt: '2024-01-20T10:15:31Z',
        updatedAt: '2024-01-20T10:15:31Z',
      },
      {
        operationAuditLogId: 'aud-003',
        userId: 'user-001',
        operationType: 'DELETE',
        targetTableName: '活動',
        targetRecordId: 'rec-003',
        changeBeforeValue: '{"type":"CALL"}',
        changeAfterValue: null,
        operationDetailContent: '活動レコード削除',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T09:45:00Z',
        id: 'id-003',
        createdAt: '2024-01-10T09:45:01Z',
        updatedAt: '2024-01-10T09:45:01Z',
      },
      {
        operationAuditLogId: 'aud-004',
        userId: 'user-003',
        operationType: 'CREATE',
        targetTableName: '請求明細',
        targetRecordId: 'rec-004',
        changeBeforeValue: null,
        changeAfterValue: '{"amount":50000}',
        operationDetailContent: '請求明細レコード作成',
        ipAddress: '192.168.1.3',
        sessionId: 'sess-004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:20:45Z',
        id: 'id-004',
        createdAt: '2024-01-25T16:20:46Z',
        updatedAt: '2024-01-25T16:20:46Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockRecords);

    const input: FetchOperationAuditLogsByPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    };

    const result = await fetchOperationAuditLogsByPeriod(input);

    expect(result.operationLogs).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    // Check descending order by operationExecutionTimestamp
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T16:20:45Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T10:15:30Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.operationLogs[3].operationExecutionTimestamp).toBe('2024-01-10T09:45:00Z');

    // Check fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    expect(dataStore.listRecords).toHaveBeenCalledWith('操作履歴');
  });
});
