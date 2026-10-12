import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-903: 操作種別フィルタがnullまたは未指定の場合、全操作種別を対象とする', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return logs for all operation types when operationTypeFilter is null', async () => {
    const allLogs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: 'user-001',
        operationType: 'CREATE',
        targetTableName: '取引先',
        targetRecordId: 'record-001',
        changeBeforeValue: null,
        changeAfterValue: '{"name": "ABC株式会社"}',
        operationDetailContent: '新規取引先作成',
        ipAddress: '192.168.1.100',
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
        changeBeforeValue: '{"amount": 100000}',
        changeAfterValue: '{"amount": 150000}',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.101',
        sessionId: 'sess-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T14:45:30Z',
        createdAt: '2024-01-20T14:45:31Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: 'user-001',
        operationType: 'DELETE',
        targetTableName: '活動',
        targetRecordId: 'record-003',
        changeBeforeValue: '{"type": "CALL"}',
        changeAfterValue: null,
        operationDetailContent: '活動レコードを削除',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T08:15:00Z',
        createdAt: '2024-01-10T08:15:01Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        userId: 'user-003',
        operationType: 'READ',
        targetTableName: '請求書',
        targetRecordId: 'record-004',
        changeBeforeValue: null,
        changeAfterValue: null,
        operationDetailContent: '請求書を参照',
        ipAddress: '192.168.1.102',
        sessionId: 'sess-004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:20:15Z',
        createdAt: '2024-01-25T16:20:16Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        userId: 'user-002',
        operationType: 'CREATE',
        targetTableName: '商談商品',
        targetRecordId: 'record-005',
        changeBeforeValue: null,
        changeAfterValue: '{"productId": "prod-001", "quantity": 5}',
        operationDetailContent: '商談に商品を追加',
        ipAddress: '192.168.1.101',
        sessionId: 'sess-005',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-05T09:00:00Z',
        createdAt: '2024-01-05T09:00:01Z',
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
    const operationTypes = result.operationLogs.map((log) => log.operationType);
    expect(operationTypes).toContain('CREATE');
    expect(operationTypes).toContain('UPDATE');
    expect(operationTypes).toContain('DELETE');
    expect(operationTypes).toContain('READ');
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T16:20:15Z');
    expect(result.operationLogs[4].operationExecutionTimestamp).toBe('2024-01-05T09:00:00Z');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
