import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-900: 対象テーブル名フィルタを指定した場合、該当テーブルの操作ログのみを取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only operations for customers table when targetTableNameFilter is customers', async () => {
    const allLogs = [
      {
        id: 'log-001',
        userId: 'user-a',
        operationType: 'CREATE',
        targetTableName: 'customers',
        targetRecordId: 'rec-101',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"Company A"}',
        operationDetailContent: '新規顧客作成',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-001',
        operationStatus: 'success',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-15T10:30:01Z',
      },
      {
        id: 'log-002',
        userId: 'user-b',
        operationType: 'UPDATE',
        targetTableName: 'orders',
        targetRecordId: 'rec-201',
        changeBeforeValue: '{"amount":1000}',
        changeAfterValue: '{"amount":1200}',
        operationDetailContent: '注文金額更新',
        ipAddress: '192.168.1.2',
        sessionId: 'sess-002',
        operationStatus: 'success',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T11:00:00Z',
        createdAt: '2024-01-15T11:00:01Z',
      },
      {
        id: 'log-003',
        userId: 'user-a',
        operationType: 'UPDATE',
        targetTableName: 'customers',
        targetRecordId: 'rec-102',
        changeBeforeValue: '{"status":"active"}',
        changeAfterValue: '{"status":"inactive"}',
        operationDetailContent: '顧客ステータス更新',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-003',
        operationStatus: 'success',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T14:15:00Z',
        createdAt: '2024-01-20T14:15:01Z',
      },
      {
        id: 'log-004',
        userId: 'user-c',
        operationType: 'DELETE',
        targetTableName: 'customers',
        targetRecordId: 'rec-103',
        changeBeforeValue: '{"name":"Company C"}',
        changeAfterValue: null,
        operationDetailContent: '顧客削除',
        ipAddress: '192.168.1.3',
        sessionId: 'sess-004',
        operationStatus: 'success',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T09:45:00Z',
        createdAt: '2024-01-25T09:45:01Z',
      },
      {
        id: 'log-005',
        userId: 'user-b',
        operationType: 'READ',
        targetTableName: 'invoices',
        targetRecordId: 'rec-301',
        changeBeforeValue: null,
        changeAfterValue: null,
        operationDetailContent: '請求書参照',
        ipAddress: '192.168.1.2',
        sessionId: 'sess-005',
        operationStatus: 'success',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-28T16:20:00Z',
        createdAt: '2024-01-28T16:20:01Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allLogs);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      targetTableNameFilter: 'customers',
      userIdFilter: null,
      operationTypeFilter: null,
      sortBy: 'operationExecutionTimestamp',
    });

    expect(result.operationLogs).toHaveLength(3);
    expect(result.operationLogs.every((log) => log.targetTableName === 'customers')).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T09:45:00Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T14:15:00Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-15T10:30:00Z');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
