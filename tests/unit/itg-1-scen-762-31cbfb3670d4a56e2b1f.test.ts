import { saveOperationAuditLog } from '../../src/logic/data-persistence';
import type { SaveOperationAuditLogInput, SaveOperationAuditLogOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-762: saveOperationAuditLog - 任意フィールドのnull保存', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('任意フィールド（changeBeforeValue、changeAfterValue、operationDetailContent、errorMessage）がnullで入力された場合、nullのまま保存されて返される', async () => {
    const mockOutput: SaveOperationAuditLogOutput = {
      operationAuditLogId: '880e8400-e29b-41d4-a716-446655440333',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: 'invoices',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetailContent: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess_abc123xyz',
      operationStatus: 'success',
      errorMessage: null,
      operationExecutionTimestamp: '2025-01-15T10:30:00Z',
      createdAt: '2025-01-15T10:30:00Z',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveOperationAuditLogInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: 'invoices',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetailContent: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess_abc123xyz',
      operationStatus: 'success',
      errorMessage: null,
      operationExecutionTimestamp: '2025-01-15T10:30:00Z',
    };

    const result = await saveOperationAuditLog(input);

    expect(result.operationAuditLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationType).toBe('update');
    expect(result.targetTableName).toBe('invoices');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.changeBeforeValue).toBeNull();
    expect(result.changeAfterValue).toBeNull();
    expect(result.operationDetailContent).toBeNull();
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('sess_abc123xyz');
    expect(result.operationStatus).toBe('success');
    expect(result.errorMessage).toBeNull();
    expect(result.operationExecutionTimestamp).toBe('2025-01-15T10:30:00Z');
    expect(result.createdAt).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T/.test(result.createdAt)).toBeTruthy();
  });
});
