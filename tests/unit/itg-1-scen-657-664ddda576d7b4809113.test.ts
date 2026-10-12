import { recordUserOperation, RecordUserOperationInput, RecordUserOperationOutput } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
}));

describe('SCEN-657: 操作詳細がnullまたは省略された場合、操作履歴に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record operation with all optional fields as null', async () => {
    const mockOperationLogId = '770e8400-e29b-41d4-a716-446655440099';
    const recordedAt = new Date('2026-10-07T10:30:00.000Z');

    const mockCreateRecord = dataStore.createRecord as jest.Mock;
    mockCreateRecord.mockResolvedValue({
      id: mockOperationLogId,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: '顧客',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: null,
      ipAddress: null,
      sessionId: null,
      recordedAt,
    });

    const input: RecordUserOperationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'update',
      targetTableName: '顧客',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      executedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    const result = await recordUserOperation(input);

    expect(result.operationLogId).toBe(mockOperationLogId);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operationType).toBe('update');
    expect(result.targetTableName).toBe('顧客');
    expect(result.targetRecordId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.recordedAt).toEqual(recordedAt);

    expect(mockCreateRecord).toHaveBeenCalledWith(
      '操作履歴',
      expect.objectContaining({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        operationType: 'update',
        targetTableName: '顧客',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      })
    );

    const createRecordCall = mockCreateRecord.mock.calls[0];
    expect(createRecordCall[1].operationDetails).toBeNull();
    expect(createRecordCall[1].ipAddress).toBeNull();
    expect(createRecordCall[1].sessionId).toBeNull();
  });
});
