import { fetchOperationAuditLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-901: 複数のフィルタを組み合わせた場合、すべての条件に合致する操作ログを取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only logs matching all filter conditions', async () => {
    const allLogs = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'UPDATE',
        targetTableName: 'deals',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: '{"amount": 100000}',
        changeAfterValue: '{"amount": 150000}',
        operationDetailContent: '商談金額を更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-001',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-15T14:30:45Z',
        createdAt: '2024-01-15T14:30:46Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'UPDATE',
        targetTableName: 'deals',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440002',
        changeBeforeValue: '{"status": "open"}',
        changeAfterValue: '{"status": "closed"}',
        operationDetailContent: '商談ステータスを更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-002',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-20T10:15:30Z',
        createdAt: '2024-01-20T10:15:31Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        operationType: 'UPDATE',
        targetTableName: 'deals',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440003',
        changeBeforeValue: '{"owner": "user1"}',
        changeAfterValue: '{"owner": "user2"}',
        operationDetailContent: '商談担当者を更新',
        ipAddress: '192.168.1.101',
        sessionId: 'sess-003',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-18T09:45:20Z',
        createdAt: '2024-01-18T09:45:21Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'UPDATE',
        targetTableName: 'contacts',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440004',
        changeBeforeValue: '{"phone": "090-1111-2222"}',
        changeAfterValue: '{"phone": "090-3333-4444"}',
        operationDetailContent: '担当者電話番号を更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-004',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-10T11:20:00Z',
        createdAt: '2024-01-10T11:20:01Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'INSERT',
        targetTableName: 'deals',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440005',
        changeBeforeValue: null,
        changeAfterValue: '{"name": "新規商談"}',
        operationDetailContent: '新規商談を作成',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-005',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-25T16:05:10Z',
        createdAt: '2024-01-25T16:05:11Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440006',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'UPDATE',
        targetTableName: 'deals',
        targetRecordId: '770e8400-e29b-41d4-a716-446655440006',
        changeBeforeValue: '{"expectedCloseDate": "2024-02-15"}',
        changeAfterValue: '{"expectedCloseDate": "2024-03-15"}',
        operationDetailContent: '予定クローズ日を更新',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-006',
        operationStatus: 'SUCCESS',
        errorMessage: null,
        operationExecutionTimestamp: '2024-01-08T13:50:25Z',
        createdAt: '2024-01-08T13:50:26Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(allLogs);

    const result = await fetchOperationAuditLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      userIdFilter: '550e8400-e29b-41d4-a716-446655440001',
      operationTypeFilter: 'UPDATE',
      targetTableNameFilter: 'deals',
      sortBy: 'operationExecutionTimestamp',
    });

    expect(result.operationLogs).toHaveLength(4);
    expect(result.operationLogs.every((log) => log.userId === '550e8400-e29b-41d4-a716-446655440001')).toBe(true);
    expect(result.operationLogs.every((log) => log.operationType === 'UPDATE')).toBe(true);
    expect(result.operationLogs.every((log) => log.targetTableName === 'deals')).toBe(true);
    expect(result.totalCount).toBe(4);

    const timestamps = result.operationLogs.map((log) => log.operationExecutionTimestamp);
    expect(timestamps).toEqual([
      '2024-01-25T16:05:10Z',
      '2024-01-20T10:15:30Z',
      '2024-01-15T14:30:45Z',
      '2024-01-08T13:50:25Z',
    ]);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
