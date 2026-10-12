import { saveOperationAuditLog, DataStoreError } from '../../src/logic/data-persistence';
import type { SaveOperationAuditLogInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-760: saveOperationAuditLog - DataStore失敗時のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('操作履歴テーブルへのレコード作成が失敗した場合、DataStoreErrorが発生する', async () => {
    (dataStore.createRecord as jest.Mock).mockRejectedValue(
      new DataStoreError('操作履歴の保存に失敗しました。システム管理者に連絡してください。')
    );

    const input: SaveOperationAuditLogInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: '更新',
      targetTableName: '商談',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: '100000',
      changeAfterValue: '150000',
      operationDetailContent: '商談金額を修正',
      ipAddress: '192.168.1.100',
      sessionId: 'sess_abc123def456',
      operationStatus: '成功',
      errorMessage: null,
      operationExecutionTimestamp: '2026-10-07T10:30:00.000Z',
    };

    await expect(saveOperationAuditLog(input)).rejects.toThrow(DataStoreError);
    await expect(saveOperationAuditLog(input)).rejects.toThrow(
      '操作履歴の保存に失敗しました。システム管理者に連絡してください。'
    );
  });
});
