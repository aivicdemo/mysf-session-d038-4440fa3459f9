import { recordUserOperation, DataStoreError, RecordUserOperationInput } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-660: DataStoreError during operation history recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with expected message when audit log recording fails', async () => {
    const mockDataStore = jest.mocked(dataStore);
    mockDataStore.createRecord.mockRejectedValue(new DataStoreError('操作履歴テーブルの読み書きに失敗'));

    const input: RecordUserOperationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: 'sales_opportunities',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: '100000',
      changeAfterValue: '150000',
      operationDetails: '商談金額を修正',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-550e8400-e29b-41d4-a716-446655440002',
      executedAt: new Date('2026-10-07T10:30:00Z'),
    };

    const error = new DataStoreError('監査ログの記録に失敗しました。システム管理者に連絡してください。');
    await expect(recordUserOperation(input)).rejects.toThrow(error);
  });
});
