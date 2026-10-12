import { recordUserOperation, RecordUserOperationInput, RecordUserOperationOutput } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
}));

describe('SCEN-655: 参照操作で変更前後の値がnullの場合、操作履歴に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record read operation with null change values', async () => {
    const mockOperationLogId = '550e8400-e29b-41d4-a716-446655440099';
    const recordedAt = new Date('2026-10-07T06:22:11.338Z');

    const mockCreateRecord = dataStore.createRecord as jest.Mock;
    mockCreateRecord.mockResolvedValue({
      id: mockOperationLogId,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'read',
      targetTableName: 'customers',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: '顧客レコード参照',
      ipAddress: '192.168.1.100',
      sessionId: 'sess_550e8400e29b41d4a716446655440000',
      operationStatus: 'success',
      errorMessage: null,
      recordedAt,
    });

    const input: RecordUserOperationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'read',
      targetTableName: 'customers',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: '顧客レコード参照',
      ipAddress: '192.168.1.100',
      sessionId: 'sess_550e8400e29b41d4a716446655440000',
      executedAt: new Date('2026-10-07T06:22:11.338Z'),
    };

    const result = await recordUserOperation(input);

    expect(result.operationLogId).toBe(mockOperationLogId);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationType).toBe('read');
    expect(result.targetTableName).toBe('customers');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.recordedAt).toEqual(recordedAt);

    expect(mockCreateRecord).toHaveBeenCalledWith(
      '操作履歴',
      expect.objectContaining({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'read',
        targetTableName: 'customers',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
        changeBeforeValue: null,
        changeAfterValue: null,
        operationDetails: '顧客レコード参照',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_550e8400e29b41d4a716446655440000',
        operationStatus: 'success',
        errorMessage: null,
      })
    );
  });
});
