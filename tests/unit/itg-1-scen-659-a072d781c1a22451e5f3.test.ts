import { recordUserOperation, RecordUserOperationInput, InvalidOperationTypeError } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
}));

describe('SCEN-659: operationTypeが\'create\'、\'update\'、\'delete\'、\'read\'以外の値の場合、InvalidOperationTypeErrorが発生し、設計済みのエラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidOperationTypeError for invalid operationType', async () => {
    const mockCreateRecord = dataStore.createRecord as jest.Mock;

    const input: any = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'invalid_operation',
      targetTableName: 'sales_opportunities',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      executedAt: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(recordUserOperation(input)).rejects.toThrow(InvalidOperationTypeError);
    await expect(recordUserOperation(input)).rejects.toThrow(
      '無効な操作種別です。作成・更新・削除・参照のいずれかを指定してください。'
    );

    expect(mockCreateRecord).not.toHaveBeenCalled();
  });
});
