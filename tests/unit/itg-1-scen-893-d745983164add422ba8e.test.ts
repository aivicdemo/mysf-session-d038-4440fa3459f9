import { fetchOperationAuditLogsByUser } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-893: fetchOperationAuditLogsByUser - totalCount正確性', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('取得した操作履歴レコードの総件数が正確に返される', async () => {
    const mockAuditLogs = [
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'CREATE',
        targetTableName: '商談',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440010',
        changeBeforeValue: null,
        changeAfterValue: '{"name":"案件A"}',
        operationDetailContent: '商談レコード作成',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T10:30:00Z',
        createdAt: '2025-01-15T10:30:00Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440010',
        changeBeforeValue: '{"amount":100000}',
        changeAfterValue: '{"amount":150000}',
        operationDetailContent: '商談金額を変更',
        ipAddress: '192.168.1.1',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T14:20:00Z',
        createdAt: '2025-01-15T14:20:00Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'CREATE',
        targetTableName: '請求書',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440011',
        changeBeforeValue: null,
        changeAfterValue: '{"invoiceNo":"INV-2025-001"}',
        operationDetailContent: '請求書を作成',
        ipAddress: '192.168.1.2',
        sessionId: 'sess-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T16:45:00Z',
        createdAt: '2025-01-15T16:45:00Z',
      },
      {
        operationAuditLogId: '550e8400-e29b-41d4-a716-446655440004',
        userId: '550e8400-e29b-41d4-a716-446655440999',
        operationType: 'DELETE',
        targetTableName: '商談商品',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440012',
        changeBeforeValue: '{"qty":5}',
        changeAfterValue: null,
        operationDetailContent: '商談商品を削除',
        ipAddress: '192.168.1.3',
        sessionId: 'sess-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-01-15T17:00:00Z',
        createdAt: '2025-01-15T17:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAuditLogs);

    const result = await fetchOperationAuditLogsByUser({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.totalCount).toBe(3);
    expect(result.operationLogs).toHaveLength(3);

    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2025-01-15T16:45:00Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2025-01-15T14:20:00Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2025-01-15T10:30:00Z');

    const userIds = result.operationLogs.map((log) => log.userId);
    expect(userIds).toEqual([
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440000',
    ]);

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
