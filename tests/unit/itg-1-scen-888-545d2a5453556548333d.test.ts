import { fetchOperationAuditLogsByUser } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-888: fetchOperationAuditLogsByUser - 操作履歴が存在し降順でソート', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定ユーザーの操作履歴が存在し、操作実行日時の降順でソートされて返される', async () => {
    const mockAuditLogs = [
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: '{"amount": 100000}',
        changeAfterValue: '{"amount": 120000}',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-07T15:30:00Z',
        createdAt: '2026-10-07T15:30:01Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'CREATE',
        targetTableName: '請求明細',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440002',
        changeBeforeValue: null,
        changeAfterValue: '{"lineAmount": 50000, "description": "商品A"}',
        operationDetailContent: '請求明細を新規作成',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-07T14:20:00Z',
        createdAt: '2026-10-07T14:20:01Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'DELETE',
        targetTableName: '請求明細',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440003',
        changeBeforeValue: '{"lineAmount": 30000}',
        changeAfterValue: null,
        operationDetailContent: '請求明細を削除',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-07T13:10:00Z',
        createdAt: '2026-10-07T13:10:01Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440004',
        userId: '880e8400-e29b-41d4-a716-446655440099',
        operationType: 'UPDATE',
        targetTableName: '取引先',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440004',
        changeBeforeValue: '{"status": "active"}',
        changeAfterValue: '{"status": "inactive"}',
        operationDetailContent: '取引先ステータス変更',
        ipAddress: '192.168.1.101',
        sessionId: 'sess_003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-07T12:00:00Z',
        createdAt: '2026-10-07T12:00:01Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAuditLogs);

    const result = await fetchOperationAuditLogsByUser({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.operationLogs).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2026-10-07T15:30:00Z');
    expect(result.operationLogs[0].operationType).toBe('UPDATE');
    expect(result.operationLogs[0].targetTableName).toBe('商談');

    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2026-10-07T14:20:00Z');
    expect(result.operationLogs[1].operationType).toBe('CREATE');
    expect(result.operationLogs[1].targetTableName).toBe('請求明細');

    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2026-10-07T13:10:00Z');
    expect(result.operationLogs[2].operationType).toBe('DELETE');
    expect(result.operationLogs[2].targetTableName).toBe('請求明細');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
