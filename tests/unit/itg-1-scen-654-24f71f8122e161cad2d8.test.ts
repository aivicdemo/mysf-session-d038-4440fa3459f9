import { recordUserOperation } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-654: 更新操作で変更前後の値が指定された場合、それらの値が操作履歴に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('変更前後の値が操作履歴テーブルに正確に記録される', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    const generatedId = '770e8400-e29b-41d4-a716-446655440088';
    const recordedAtTime = new Date('2026-10-07T14:30:00.000Z');

    // モック設定: createRecord が新規レコードを返す
    (mockDataStore.createRecord as jest.Mock).mockResolvedValue({
      id: generatedId,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: 'invoices',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: '¥100000',
      changeAfterValue: '¥150000',
      operationDetails: '請求額を修正',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-7a8b9c0d-e1f2-43a4-b5c6-d7e8f9a0b1c2',
      operationStatus: '成功',
      errorMessage: null,
      operationExecutedAt: new Date('2026-10-07T14:30:00.000Z'),
      createdAt: recordedAtTime,
    });

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update' as const,
      targetTableName: 'invoices',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: '¥100000',
      changeAfterValue: '¥150000',
      operationDetails: '請求額を修正',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-7a8b9c0d-e1f2-43a4-b5c6-d7e8f9a0b1c2',
      executedAt: new Date('2026-10-07T14:30:00.000Z'),
    };

    const result = await recordUserOperation(input);

    // 出力の検証
    expect(result.operationLogId).toBe(generatedId);
    expect(result.operationLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationType).toBe('update');
    expect(result.targetTableName).toBe('invoices');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.recordedAt.getTime()).toBeGreaterThanOrEqual(recordedAtTime.getTime());

    // createRecord が正しいテーブルと入力で呼ばれたことを確認
    expect(mockDataStore.createRecord).toHaveBeenCalledWith(
      '操作履歴',
      expect.objectContaining({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'update',
        targetTableName: 'invoices',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: '¥100000',
        changeAfterValue: '¥150000',
        operationDetails: '請求額を修正',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-7a8b9c0d-e1f2-43a4-b5c6-d7e8f9a0b1c2',
      }),
    );
  });
});
