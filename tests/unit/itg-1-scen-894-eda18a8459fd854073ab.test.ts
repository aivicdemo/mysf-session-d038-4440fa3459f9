import { fetchOperationAuditLogsByUser } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-894: fetchOperationAuditLogsByUser - fetchedAtのISO 8601形式', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('操作履歴を取得した日時がISO 8601形式で返される', async () => {
    const mockAuditLogs = [
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'CREATE',
        targetTableName: '商談',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: null,
        changeAfterValue: '{"amount": 100000}',
        operationDetailContent: '新規商談を作成',
        ipAddress: '192.168.1.100',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-06-15T10:30:00Z',
        createdAt: '2025-06-15T10:30:01Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: '{"status": "OPEN"}',
        changeAfterValue: '{"status": "WON"}',
        operationDetailContent: '商談ステータスを更新',
        ipAddress: '192.168.1.100',
        sessionId: 'session-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-06-15T14:45:30Z',
        createdAt: '2025-06-15T14:45:31Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'DELETE',
        targetTableName: '請求明細',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440002',
        changeBeforeValue: '{"lineItem": "product-A"}',
        changeAfterValue: null,
        operationDetailContent: '請求明細を削除',
        ipAddress: '192.168.1.101',
        sessionId: 'session-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2025-06-15T16:20:15Z',
        createdAt: '2025-06-15T16:20:16Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAuditLogs);

    const result = await fetchOperationAuditLogsByUser({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    expect(result.operationLogs).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2025-06-15T16:20:15Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2025-06-15T14:45:30Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2025-06-15T10:30:00Z');
  });
});
