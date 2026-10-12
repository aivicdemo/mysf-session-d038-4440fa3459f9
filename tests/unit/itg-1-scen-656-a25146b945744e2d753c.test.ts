import { recordUserOperation, RecordUserOperationInput, RecordUserOperationOutput } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
}));

describe('SCEN-656: IPアドレスとセッションIDが任意項目として省略された場合、操作履歴に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record update operation with null ipAddress and sessionId', async () => {
    const mockOperationLogId = '660e8400-e29b-41d4-a716-446655440099';
    const recordedAt = new Date('2024-12-15T10:30:00Z');

    const mockCreateRecord = dataStore.createRecord as jest.Mock;
    mockCreateRecord.mockResolvedValue({
      id: mockOperationLogId,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: 'invoices',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: '¥100,000',
      changeAfterValue: '¥120,000',
      operationDetails: '金額を修正',
      ipAddress: null,
      sessionId: null,
      recordedAt,
    });

    const input: RecordUserOperationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: 'invoices',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: '¥100,000',
      changeAfterValue: '¥120,000',
      operationDetails: '金額を修正',
      executedAt: new Date('2024-12-15T10:30:00Z'),
    };

    const result = await recordUserOperation(input);

    expect(result.operationLogId).toBe(mockOperationLogId);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationType).toBe('update');
    expect(result.targetTableName).toBe('invoices');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.recordedAt).toEqual(recordedAt);

    expect(mockCreateRecord).toHaveBeenCalledWith(
      '操作履歴',
      expect.objectContaining({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'update',
        targetTableName: 'invoices',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: '¥100,000',
        changeAfterValue: '¥120,000',
        operationDetails: '金額を修正',
      })
    );
  });
});
