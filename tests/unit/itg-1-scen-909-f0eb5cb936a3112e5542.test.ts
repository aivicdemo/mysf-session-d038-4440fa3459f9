import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchOperationAuditLogsByPeriod, type FetchOperationAuditLogsByPeriodInput, type FetchOperationAuditLogsByPeriodOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-909: 操作履歴ログ取得 - 取得日時がISO 8601形式', () => {
  const mockAuditLogs = [
    {
      operationAuditLogId: '550e8400-e29b-41d4-a716-446655440001',
      userId: 'user-001',
      operationType: 'CREATE',
      targetTableName: '取引先',
      targetRecordId: 'record-001',
      changeBeforeValue: null,
      changeAfterValue: '{"name": "ABC Corporation"}',
      operationDetailContent: '新規取引先作成',
      ipAddress: '192.168.1.1',
      sessionId: 'session-001',
      operationStatus: 'SUCCESS',
      errorMessage: null,
      operationExecutionTimestamp: '2024-01-15T14:30:00Z',
      id: 'audit-001',
      createdAt: '2024-01-15T14:30:01Z',
    },
    {
      operationAuditLogId: '550e8400-e29b-41d4-a716-446655440002',
      userId: 'user-002',
      operationType: 'UPDATE',
      targetTableName: '商談',
      targetRecordId: 'record-002',
      changeBeforeValue: '{"amount": 100000}',
      changeAfterValue: '{"amount": 120000}',
      operationDetailContent: '商談金額を更新',
      ipAddress: '192.168.1.2',
      sessionId: 'session-002',
      operationStatus: 'SUCCESS',
      errorMessage: null,
      operationExecutionTimestamp: '2024-01-20T10:15:30Z',
      id: 'audit-002',
      createdAt: '2024-01-20T10:15:31Z',
    },
    {
      operationAuditLogId: '550e8400-e29b-41d4-a716-446655440003',
      userId: 'user-001',
      operationType: 'DELETE',
      targetTableName: '活動',
      targetRecordId: 'record-003',
      changeBeforeValue: '{"title": "Meeting"}',
      changeAfterValue: null,
      operationDetailContent: '活動レコード削除',
      ipAddress: '192.168.1.1',
      sessionId: 'session-001',
      operationStatus: 'SUCCESS',
      errorMessage: null,
      operationExecutionTimestamp: '2024-01-25T16:45:00Z',
      id: 'audit-003',
      createdAt: '2024-01-25T16:45:01Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchedAt フィールドが ISO 8601 形式で含まれ、operationLogs が操作実行日時の降順で返される', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue(mockAuditLogs as any);

    const input: FetchOperationAuditLogsByPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      userIdFilter: null,
      operationTypeFilter: null,
      targetTableNameFilter: null,
      sortBy: 'operationExecutionTimestamp',
    };

    const result: FetchOperationAuditLogsByPeriodOutput = await fetchOperationAuditLogsByPeriod(input);

    // fetchedAt が ISO 8601 形式か確認
    expect(result.fetchedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    // operationLogs が3件含まれているか確認
    expect(result.operationLogs).toHaveLength(3);

    // totalCount が3か確認
    expect(result.totalCount).toBe(3);

    // operationLogs が操作実行日時の降順 (新しい順) で並んでいるか確認
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe('2024-01-25T16:45:00Z');
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe('2024-01-20T10:15:30Z');
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe('2024-01-15T14:30:00Z');
  });
});
