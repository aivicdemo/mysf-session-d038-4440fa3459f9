import { fetchOperationAuditLogsByRecord } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-887: fetchOperationAuditLogsByRecord - fetchedAt ISO 8601形式', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('出力の fetchedAt は処理完了時点のISO 8601形式の日時が設定される', async () => {
    const mockAuditLogs = [
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '770e8400-e29b-41d4-a716-446655440001',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
        changeBeforeValue: '{"ステータス":"提案中"}',
        changeAfterValue: '{"ステータス":"受注"}',
        operationDetailContent: '商談ステータスを提案中から受注に変更',
        ipAddress: '192.168.1.100',
        sessionId: 'session-001',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-05T10:30:00Z',
        createdAt: '2026-10-05T10:30:15Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '770e8400-e29b-41d4-a716-446655440002',
        operationType: 'UPDATE',
        targetTableName: '商談',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
        changeBeforeValue: '{"金額":"1000000"}',
        changeAfterValue: '{"金額":"1200000"}',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.101',
        sessionId: 'session-002',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-05T09:15:00Z',
        createdAt: '2026-10-05T09:15:20Z',
      },
      {
        operationAuditLogId: '660e8400-e29b-41d4-a716-446655440003',
        userId: '770e8400-e29b-41d4-a716-446655440003',
        operationType: 'CREATE',
        targetTableName: '商談',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
        changeBeforeValue: null,
        changeAfterValue: '{"商談名":"ABC株式会社との商談","金額":"1000000","ステータス":"提案中"}',
        operationDetailContent: '新規商談を作成',
        ipAddress: '192.168.1.102',
        sessionId: 'session-003',
        operationStatus: '成功',
        errorMessage: null,
        operationExecutionTimestamp: '2026-10-05T08:00:00Z',
        createdAt: '2026-10-05T08:00:10Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAuditLogs);

    const result = await fetchOperationAuditLogsByRecord({
      targetTableName: '商談',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    const fetchedAtTime = new Date(result.fetchedAt).getTime();
    const operationTimes = mockAuditLogs.map(
      (log) => new Date(log.operationExecutionTimestamp).getTime()
    );
    const maxOperationTime = Math.max(...operationTimes);

    expect(fetchedAtTime).toBeGreaterThanOrEqual(maxOperationTime);
    expect(result.operationLogs).toHaveLength(3);
  });
});
