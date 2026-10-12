import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-899: 操作種別フィルタを指定した場合、該当操作種別の操作ログのみを取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only UPDATE operation logs when operationTypeFilter is UPDATE', async () => {
    const allLogs = [
      {
        id: 'log-001',
        userId: 'user-A',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: 'deal-001',
        changeBeforeValue: '金額:1000000',
        changeAfterValue: '金額:1200000',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.1',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T14:30:00Z',
        createdAt: '2024-01-15T14:30:01Z',
      },
      {
        id: 'log-002',
        userId: 'user-B',
        operationType: 'INSERT',
        targetTableName: '取引先',
        targetRecordId: 'account-001',
        changeBeforeValue: null,
        changeAfterValue: '社名:株式会社ABC',
        operationDetailContent: '新規取引先を作成',
        ipAddress: '192.168.1.2',
        sessionId: 'session-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T09:15:00Z',
        createdAt: '2024-01-10T09:15:01Z',
      },
      {
        id: 'log-003',
        userId: 'user-A',
        operationType: 'UPDATE',
        targetTableName: '請求書',
        targetRecordId: 'invoice-001',
        changeBeforeValue: 'ステータス:下書き',
        changeAfterValue: 'ステータス:発行済み',
        operationDetailContent: '請求書のステータスを更新',
        ipAddress: '192.168.1.1',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T11:45:00Z',
        createdAt: '2024-01-20T11:45:01Z',
      },
      {
        id: 'log-004',
        userId: 'user-C',
        operationType: 'DELETE',
        targetTableName: '商談商品',
        targetRecordId: 'dealproduct-001',
        changeBeforeValue: '商品ID:prod-001',
        changeAfterValue: null,
        operationDetailContent: '商談商品を削除',
        ipAddress: '192.168.1.3',
        sessionId: 'session-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:20:00Z',
        createdAt: '2024-01-25T16:20:01Z',
      },
      {
        id: 'log-005',
        userId: 'user-B',
        operationType: 'UPDATE',
        targetTableName: '取引先責任者',
        targetRecordId: 'contact-001',
        changeBeforeValue: 'メール:old@example.com',
        changeAfterValue: 'メール:new@example.com',
        operationDetailContent: '取引先責任者のメールを更新',
        ipAddress: '192.168.1.2',
        sessionId: 'session-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-05T10:00:00Z',
        createdAt: '2024-01-05T10:00:01Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allLogs);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      operationTypeFilter: 'UPDATE',
      userIdFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    });

    expect(result.operationLogs).toHaveLength(3);
    expect(result.operationLogs.every((log) => log.operationType === 'UPDATE')).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-20T11:45:00Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-05T10:00:00Z');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
