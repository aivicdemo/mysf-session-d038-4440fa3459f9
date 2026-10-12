import { saveOperationAuditLog } from '../../src/logic/data-persistence';
import type { SaveOperationAuditLogInput, SaveOperationAuditLogOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-759: saveOperationAuditLog - 必須フィールド揃い時の正常保存', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須フィールドが全て揃い、操作履歴テーブルへの保存に成功した場合、保存されたレコードを操作履歴IDを含めて返す', async () => {
    const mockOutput: SaveOperationAuditLogOutput = {
      operationAuditLogId: '770e8400-e29b-41d4-a716-446655440222',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: '更新',
      targetTableName: '商談',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440111',
      changeBeforeValue: '100000',
      changeAfterValue: '150000',
      operationDetailContent: '商談金額を修正',
      ipAddress: '192.168.1.100',
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440000',
      operationStatus: '成功',
      errorMessage: null,
      operationExecutionTimestamp: '2025-01-15T14:30:00Z',
      createdAt: '2025-01-15T14:30:00Z',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveOperationAuditLogInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: '更新',
      targetTableName: '商談',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440111',
      changeBeforeValue: '100000',
      changeAfterValue: '150000',
      operationDetailContent: '商談金額を修正',
      ipAddress: '192.168.1.100',
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440000',
      operationStatus: '成功',
      errorMessage: null,
      operationExecutionTimestamp: '2025-01-15T14:30:00Z',
    };

    const result = await saveOperationAuditLog(input);

    expect(result.operationAuditLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationType).toBe('更新');
    expect(result.targetTableName).toBe('商談');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440111');
    expect(result.changeBeforeValue).toBe('100000');
    expect(result.changeAfterValue).toBe('150000');
    expect(result.operationDetailContent).toBe('商談金額を修正');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationStatus).toBe('成功');
    expect(result.errorMessage).toBeNull();
    expect(result.operationExecutionTimestamp).toBe('2025-01-15T14:30:00Z');
    expect(result.createdAt).toBeDefined();
  });
});
