import { recordUserOperation, RecordUserOperationInput, MissingRequiredFieldError } from '../../src/logic/audit-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
}));

describe('SCEN-658: 必須フィールドのいずれかが不足している場合、MissingRequiredFieldErrorが発生し、設計済みのエラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MissingRequiredFieldError when userId is null', async () => {
    const mockCreateRecord = dataStore.createRecord as jest.Mock;

    const input: any = {
      userId: null,
      operationType: 'create',
      targetTableName: 'invoices',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      executedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    await expect(recordUserOperation(input)).rejects.toThrow(MissingRequiredFieldError);
    await expect(recordUserOperation(input)).rejects.toThrow(
      '必須項目が不足しています。ユーザーID、操作種別、対象テーブル、対象レコードID、実行日時を指定してください。'
    );

    expect(mockCreateRecord).not.toHaveBeenCalled();
  });
});
