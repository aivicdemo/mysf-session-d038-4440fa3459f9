import { saveOperationAuditLog, InvalidOperationAuditLogInputError } from '../../src/logic/data-persistence';
import type { SaveOperationAuditLogInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-761: saveOperationAuditLog - 必須フィールド不足時のバリデーション', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須フィールド（userIdまたはoperationTypeまたはtargetTableNameまたはtargetRecordIdまたはoperationExecutionTimestamp）が不足している場合、InvalidOperationAuditLogInputErrorが発生する', async () => {
    const input: SaveOperationAuditLogInput = {
      userId: null as any,
      operationType: 'CREATE',
      targetTableName: 'sales_opportunities',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      changeBeforeValue: null,
      changeAfterValue: '{"name": "新規商談"}',
      operationDetailContent: '新規商談を作成',
      ipAddress: '192.168.1.100',
      sessionId: 'session-12345',
      operationStatus: 'SUCCESS',
      errorMessage: null,
      operationExecutionTimestamp: '2026-10-07T06:22:11.338Z',
    };

    await expect(saveOperationAuditLog(input)).rejects.toThrow(InvalidOperationAuditLogInputError);
    await expect(saveOperationAuditLog(input)).rejects.toThrow(
      '操作履歴の必須項目が不足しています。'
    );
  });
});
