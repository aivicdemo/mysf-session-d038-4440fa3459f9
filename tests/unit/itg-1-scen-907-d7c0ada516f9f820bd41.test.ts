import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-907: ソート対象フィールドをoperationTypeに指定した場合、操作種別でソートされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort by operationType in ascending order', async () => {
    const allLogs = [
      {
        id: 'log-001',
        userId: 'user-A',
        operationType: 'UPDATE',
        targetTableName: '取引先',
        targetRecordId: 'record-001',
        changeBeforeValue: '旧社名',
        changeAfterValue: '新社名',
        operationDetailContent: '企業名を更新',
        ipAddress: '192.168.1.1',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-15T10:30:01Z',
        updatedAt: '2024-01-15T10:30:01Z',
      },
      {
        id: 'log-002',
        userId: 'user-B',
        operationType: 'CREATE',
        targetTableName: '商談',
        targetRecordId: 'record-002',
        changeBeforeValue: null,
        changeAfterValue: '新規商談データ',
        operationDetailContent: '新規商談を作成',
        ipAddress: '192.168.1.2',
        sessionId: 'session-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T14:20:00Z',
        createdAt: '2024-01-15T14:20:01Z',
        updatedAt: '2024-01-15T14:20:01Z',
      },
      {
        id: 'log-003',
        userId: 'user-A',
        operationType: 'DELETE',
        targetTableName: '活動',
        targetRecordId: 'record-003',
        changeBeforeValue: '削除対象データ',
        changeAfterValue: null,
        operationDetailContent: '活動レコードを削除',
        ipAddress: '192.168.1.1',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T09:15:00Z',
        createdAt: '2024-01-20T09:15:01Z',
        updatedAt: '2024-01-20T09:15:01Z',
      },
      {
        id: 'log-004',
        userId: 'user-C',
        operationType: 'READ',
        targetTableName: '請求書',
        targetRecordId: 'record-004',
        changeBeforeValue: null,
        changeAfterValue: null,
        operationDetailContent: '請求書を参照',
        ipAddress: '192.168.1.3',
        sessionId: 'session-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:45:00Z',
        createdAt: '2024-01-25T16:45:01Z',
        updatedAt: '2024-01-25T16:45:01Z',
      },
      {
        id: 'log-005',
        userId: 'user-B',
        operationType: 'UPDATE',
        targetTableName: '商談商品',
        targetRecordId: 'record-005',
        changeBeforeValue: '旧金額',
        changeAfterValue: '新金額',
        operationDetailContent: '商談商品の金額を更新',
        ipAddress: '192.168.1.2',
        sessionId: 'session-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T11:00:00Z',
        createdAt: '2024-01-10T11:00:01Z',
        updatedAt: '2024-01-10T11:00:01Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allLogs);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      sortBy: 'operationType',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
    });

    expect(result.operationLogs).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.operationLogs[0].operationType).toBe('CREATE');
    expect(result.operationLogs[1].operationType).toBe('DELETE');
    expect(result.operationLogs[2].operationType).toBe('READ');
    expect(result.operationLogs[3].operationType).toBe('UPDATE');
    expect(result.operationLogs[4].operationType).toBe('UPDATE');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
