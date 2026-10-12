import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { FetchOperationAuditLogsByPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-898: ユーザーIDフィルタを指定した場合、該当ユーザーの操作ログのみを取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch only operation logs for specified user when userIdFilter is provided', async () => {
    const mockRecords = [
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'CREATE',
        targetTableName: '取引先',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"株式会社ABC"}',
        operationDetailContent: '新規取引先レコード作成',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T14:30:00Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440002',
        changeBeforeValue: '{"status":"NEGOTIATION"}',
        changeAfterValue: '{"status":"CLOSED_WON"}',
        operationDetailContent: '商談ステータス更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T10:15:30Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'DELETE',
        targetTableName: '活動',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440003',
        changeBeforeValue: '{"type":"CALL"}',
        changeAfterValue: null,
        operationDetailContent: '活動レコード削除',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T09:45:00Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440004',
        userId: '660e8400-e29b-41d4-a716-446655440099',
        operationType: 'CREATE',
        targetTableName: '取引先責任者',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440004',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"山田太郎"}',
        operationDetailContent: '新規取引先責任者作成',
        ipAddress: '192.168.1.101',
        sessionId: 'sess_004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-12T11:20:00Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440005',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'CREATE',
        targetTableName: '請求書',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440005',
        changeBeforeValue: null,
        changeAfterValue: '{"amount":150000}',
        operationDetailContent: '請求書レコード作成',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_005',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockRecords);

    const input: FetchOperationAuditLogsByPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      userIdFilter: '550e8400-e29b-41d4-a716-446655440001',
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    };

    const result = await fetchOperationAuditLogsByPeriod(input);

    // Should include only the specified user's logs
    expect(result.operationLogs).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // All logs should belong to the specified user
    result.operationLogs.forEach((log) => {
      expect(log.userId).toBe('550e8400-e29b-41d4-a716-446655440001');
    });

    // Check descending order by operationExecutionTimestamp
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T16:00:00Z');
    expect(result.operationLogs[0].targetTableName).toBe('請求書');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T10:15:30Z');
    expect(result.operationLogs[1].targetTableName).toBe('商談');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-10T09:45:00Z');
    expect(result.operationLogs[2].targetTableName).toBe('活動');

    // Check fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // Other user's log should not be included
    expect(result.operationLogs.some((log) => log.userId === '660e8400-e29b-41d4-a716-446655440099')).toBe(false);
  });
});
