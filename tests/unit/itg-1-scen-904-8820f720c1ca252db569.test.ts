import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-904: 対象テーブル名フィルタがnullまたは未指定の場合、全テーブルを対象とする', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return logs for all tables when targetTableNameFilter is null', async () => {
    const allLogs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: 'user-001',
        operationType: 'INSERT',
        targetTableName: '取引先',
        targetRecordId: 'record-001',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"Company A"}',
        operationDetailContent: '新規取引先登録',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-15T10:30:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: 'user-002',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: 'record-002',
        changeBeforeValue: '{"status":"Open"}',
        changeAfterValue: '{"status":"Closed Won"}',
        operationDetailContent: '商談ステータス更新',
        ipAddress: '192.168.1.2',
        sessionId: 'sess-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T14:15:00Z',
        createdAt: '2024-01-20T14:15:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: 'user-001',
        operationType: 'INSERT',
        targetTableName: '請求書',
        targetRecordId: 'record-003',
        changeBeforeValue: null,
        changeAfterValue: '{"amount":"100000"}',
        operationDetailContent: '請求書新規作成',
        ipAddress: '192.168.1.3',
        sessionId: 'sess-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T09:45:00Z',
        createdAt: '2024-01-25T09:45:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        userId: 'user-003',
        operationType: 'DELETE',
        targetTableName: '取引先責任者',
        targetRecordId: 'record-004',
        changeBeforeValue: '{"name":"John Doe"}',
        changeAfterValue: null,
        operationDetailContent: '責任者情報削除',
        ipAddress: '192.168.1.4',
        sessionId: 'sess-004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T16:20:00Z',
        createdAt: '2024-01-10T16:20:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        userId: 'user-002',
        operationType: 'INSERT',
        targetTableName: '活動',
        targetRecordId: 'record-005',
        changeBeforeValue: null,
        changeAfterValue: '{"type":"Call"}',
        operationDetailContent: '活動記録追加',
        ipAddress: '192.168.1.5',
        sessionId: 'sess-005',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-05T11:00:00Z',
        createdAt: '2024-01-05T11:00:01Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allLogs);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    });

    expect(result.operationLogs).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    const tableNames = result.operationLogs.map((log) => log.targetTableName);
    expect(tableNames).toContain('取引先');
    expect(tableNames).toContain('商談');
    expect(tableNames).toContain('請求書');
    expect(tableNames).toContain('取引先責任者');
    expect(tableNames).toContain('活動');
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T09:45:00Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T14:15:00Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-15T10:30:00Z');
    expect(result.operationLogs[3].operationExecutionTimestamp).toBe('2024-01-10T16:20:00Z');
    expect(result.operationLogs[4].operationExecutionTimestamp).toBe('2024-01-05T11:00:00Z');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
