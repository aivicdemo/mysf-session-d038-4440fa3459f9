import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-906: ソート対象フィールドをuserIdに指定した場合、ユーザーIDでソートされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort by userId in ascending order', async () => {
    const allLogs = [
      {
        id: 'log-001',
        userId: 'user-c',
        operationType: 'CREATE',
        targetTableName: '取引先',
        targetRecordId: 'record-001',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"Company A"}',
        operationDetailContent: '取引先レコード作成',
        ipAddress: '192.168.1.100',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-15T10:30:01Z',
        updatedAt: '2024-01-15T10:30:01Z',
      },
      {
        id: 'log-002',
        userId: 'user-a',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: 'record-002',
        changeBeforeValue: '{"amount":100000}',
        changeAfterValue: '{"amount":120000}',
        operationDetailContent: '商談金額更新',
        ipAddress: '192.168.1.101',
        sessionId: 'session-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T14:15:30Z',
        createdAt: '2024-01-20T14:15:31Z',
        updatedAt: '2024-01-20T14:15:31Z',
      },
      {
        id: 'log-003',
        userId: 'user-b',
        operationType: 'DELETE',
        targetTableName: '活動',
        targetRecordId: 'record-003',
        changeBeforeValue: '{"status":"SCHEDULED"}',
        changeAfterValue: null,
        operationDetailContent: '活動レコード削除',
        ipAddress: '192.168.1.102',
        sessionId: 'session-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T09:00:00Z',
        createdAt: '2024-01-10T09:00:01Z',
        updatedAt: '2024-01-10T09:00:01Z',
      },
      {
        id: 'log-004',
        userId: 'user-a',
        operationType: 'READ',
        targetTableName: '請求書',
        targetRecordId: 'record-004',
        changeBeforeValue: null,
        changeAfterValue: null,
        operationDetailContent: '請求書レコード参照',
        ipAddress: '192.168.1.103',
        sessionId: 'session-004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:45:00Z',
        createdAt: '2024-01-25T16:45:01Z',
        updatedAt: '2024-01-25T16:45:01Z',
      },
      {
        id: 'log-005',
        userId: 'user-c',
        operationType: 'CREATE',
        targetTableName: '請求明細',
        targetRecordId: 'record-005',
        changeBeforeValue: null,
        changeAfterValue: '{"lineNumber":1,"amount":50000}',
        operationDetailContent: '請求明細レコード作成',
        ipAddress: '192.168.1.104',
        sessionId: 'session-005',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-22T11:20:00Z',
        createdAt: '2024-01-22T11:20:01Z',
        updatedAt: '2024-01-22T11:20:01Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allLogs);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      sortBy: 'userId',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
    });

    expect(result.operationLogs).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.operationLogs[0].userId).toBe('user-a');
    expect(result.operationLogs[1].userId).toBe('user-a');
    expect(result.operationLogs[2].userId).toBe('user-b');
    expect(result.operationLogs[3].userId).toBe('user-c');
    expect(result.operationLogs[4].userId).toBe('user-c');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
