import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-902: ユーザーIDフィルタがnullまたは未指定の場合、全ユーザーの操作ログを対象とする', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return logs for all users when userIdFilter is null', async () => {
    const allLogs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: 'user-uuid-001',
        operationType: 'INSERT',
        targetTableName: '顧客',
        targetRecordId: 'rec-001',
        changeBeforeValue: null,
        changeAfterValue: '{"name": "顧客A"}',
        operationDetailContent: '顧客レコード作成',
        ipAddress: '192.168.1.100',
        sessionId: 'session-001',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T14:30:00Z',
        createdAt: '2024-01-15T14:30:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: 'user-uuid-002',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: 'rec-002',
        changeBeforeValue: '{"金額": 100000}',
        changeAfterValue: '{"金額": 150000}',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.101',
        sessionId: 'session-002',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T09:15:30Z',
        createdAt: '2024-01-20T09:15:31Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: 'user-uuid-001',
        operationType: 'DELETE',
        targetTableName: '活動',
        targetRecordId: 'rec-003',
        changeBeforeValue: '{"状態": "実行済み"}',
        changeAfterValue: null,
        operationDetailContent: '活動レコード削除',
        ipAddress: '192.168.1.100',
        sessionId: 'session-003',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:45:00Z',
        createdAt: '2024-01-25T16:45:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        userId: 'user-uuid-003',
        operationType: 'INSERT',
        targetTableName: '請求書',
        targetRecordId: 'rec-004',
        changeBeforeValue: null,
        changeAfterValue: '{"請求番号": "INV-2024-001"}',
        operationDetailContent: '請求書作成',
        ipAddress: '192.168.1.102',
        sessionId: 'session-004',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T08:00:00Z',
        createdAt: '2024-01-10T08:00:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        userId: 'user-uuid-002',
        operationType: 'READ',
        targetTableName: '顧客',
        targetRecordId: 'rec-005',
        changeBeforeValue: null,
        changeAfterValue: null,
        operationDetailContent: '顧客情報参照',
        ipAddress: '192.168.1.101',
        sessionId: 'session-005',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-05T11:20:15Z',
        createdAt: '2024-01-05T11:20:16Z',
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
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T16:45:00Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T09:15:30Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.operationLogs[3].operationExecutionTimestamp).toBe('2024-01-10T08:00:00Z');
    expect(result.operationLogs[4].operationExecutionTimestamp).toBe('2024-01-05T11:20:15Z');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
