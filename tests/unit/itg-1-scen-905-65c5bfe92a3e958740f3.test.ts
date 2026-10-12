import { fetchOperationAuditLogsByPeriod, type OperationAuditLogRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('fetchOperationAuditLogsByPeriod', () => {
  describe('SCEN-905: Default sort by operationExecutionTimestamp when sortBy is null', () => {
    it('should sort by operationExecutionTimestamp in descending order when sortBy is null', async () => {
      const mockAuditLogs: OperationAuditLogRecord[] = [
        {
          operationAuditLogId: 'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d',
          userId: 'user-001',
          operationType: 'INSERT',
          targetTableName: '営業商談',
          targetRecordId: 'deal-101',
          changeBeforeValue: null,
          changeAfterValue: '{"商談金額":1000000}',
          operationDetailContent: '新規商談を作成',
          ipAddress: '192.168.1.100',
          sessionId: 'sess-001',
          operationStatus: '成功',
          errorMessage: null,
          operationExecutionTimestamp: '2024-01-15T14:30:00Z',
          createdAt: '2024-01-15T14:30:05Z',
        },
        {
          operationAuditLogId: 'b2c3d4e5-f6a7-5b6c-0d9e-8f7g6h5i4j3k',
          userId: 'user-002',
          operationType: 'UPDATE',
          targetTableName: '請求書',
          targetRecordId: 'inv-202',
          changeBeforeValue: '{"ステータス":"未請求"}',
          changeAfterValue: '{"ステータス":"請求済"}',
          operationDetailContent: '請求書ステータスを更新',
          ipAddress: '192.168.1.101',
          sessionId: 'sess-002',
          operationStatus: '成功',
          errorMessage: null,
          operationExecutionTimestamp: '2024-01-20T10:15:30Z',
          createdAt: '2024-01-20T10:15:35Z',
        },
        {
          operationAuditLogId: 'c3d4e5f6-a7b8-6c7d-1e0f-9g8h7i6j5k4l',
          userId: 'user-001',
          operationType: 'DELETE',
          targetTableName: '営業商談',
          targetRecordId: 'deal-102',
          changeBeforeValue: '{"商談金額":500000}',
          changeAfterValue: null,
          operationDetailContent: '不要な商談を削除',
          ipAddress: '192.168.1.100',
          sessionId: 'sess-001',
          operationStatus: '成功',
          errorMessage: null,
          operationExecutionTimestamp: '2024-01-10T09:45:00Z',
          createdAt: '2024-01-10T09:45:05Z',
        },
        {
          operationAuditLogId: 'd4e5f6a7-b8c9-7d8e-2f1g-0h9i8j7k6l5m',
          userId: 'user-003',
          operationType: 'INSERT',
          targetTableName: '請求明細',
          targetRecordId: 'detail-303',
          changeBeforeValue: null,
          changeAfterValue: '{"品目":"コンサルティング","金額":200000}',
          operationDetailContent: '請求明細行を追加',
          ipAddress: '192.168.1.102',
          sessionId: 'sess-003',
          operationStatus: '成功',
          errorMessage: null,
          operationExecutionTimestamp: '2024-01-25T16:20:15Z',
          createdAt: '2024-01-25T16:20:20Z',
        },
      ];

      (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAuditLogs);

      const result = await fetchOperationAuditLogsByPeriod({
        periodStartDateTime: '2024-01-01T00:00:00Z',
        periodEndDateTime: '2024-01-31T23:59:59Z',
        userIdFilter: null,
        operationTypeFilter: null,
        targetTableNameFilter: null,
        sortBy: null,
      });

      expect(result.totalCount).toBe(4);
      expect(result.operationLogs).toHaveLength(4);

      // Verify descending order by operationExecutionTimestamp
      expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T16:20:15Z');
      expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T10:15:30Z');
      expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-15T14:30:00Z');
      expect(result.operationLogs[3].operationExecutionTimestamp).toBe('2024-01-10T09:45:00Z');

      expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });
});
