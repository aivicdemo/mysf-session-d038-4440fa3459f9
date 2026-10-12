import { recordUserOperation } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-653: 必須フィールド全て揃った正常な操作を記録すると、操作履歴テーブルに全ての入力値が永続化され、生成されたIDと記録日時を含む出力が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全ての入力フィールドが永続化され、生成されたIDと記録日時を含む出力が返される', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    const generatedId = '550e8400-e29b-41d4-a716-446655440099';
    const recordedAtTime = new Date('2026-10-07T10:30:00.000Z');

    // モック設定: createRecord が新規レコードを返す
    (mockDataStore.createRecord as jest.Mock).mockResolvedValue({
      id: generatedId,
      userId: '550e8400-e29b-41d4-a716-446655440001',
      operationType: 'update',
      targetTableName: 'invoices',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440002',
      changeBeforeValue: '10000',
      changeAfterValue: '15000',
      operationDetails: '請求金額を修正しました',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-550e8400-e29b-41d4-a716-446655440003',
      operationStatus: '成功',
      errorMessage: null,
      operationExecutedAt: new Date('2026-10-07T10:30:00.000Z'),
      createdAt: recordedAtTime,
    });

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      operationType: 'update' as const,
      targetTableName: 'invoices',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440002',
      changeBeforeValue: '10000',
      changeAfterValue: '15000',
      operationDetails: '請求金額を修正しました',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-550e8400-e29b-41d4-a716-446655440003',
      executedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    const result = await recordUserOperation(input);

    // 出力の検証
    expect(result.operationLogId).toBe(generatedId);
    expect(result.operationLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.operationType).toBe('update');
    expect(result.targetTableName).toBe('invoices');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.recordedAt.getTime()).toBeGreaterThanOrEqual(recordedAtTime.getTime());

    // createRecord が正しいテーブルと入力で呼ばれたことを確認
    expect(mockDataStore.createRecord).toHaveBeenCalledWith(
      '操作履歴',
      expect.objectContaining({
        userId: '550e8400-e29b-41d4-a716-446655440001',
        operationType: 'update',
        targetTableName: 'invoices',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440002',
        changeBeforeValue: '10000',
        changeAfterValue: '15000',
        operationDetails: '請求金額を修正しました',
        ipAddress: '192.168.1.100',
        sessionId: 'sess-550e8400-e29b-41d4-a716-446655440003',
      }),
    );
  });
});
