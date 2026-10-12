import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-961: deleteRecord - 営業目標レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する営業目標レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = '営業目標';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
      取引先ID: '550e8400-e29b-41d4-a716-446655440002',
      対象年月: '2024-12',
      目標金額: 5000000,
      目標件数: 10,
      ステータス: '進行中',
      備考: 'Q4営業目標',
      createdAt: '2024-10-01T09:00:00.000Z',
      作成者: 'admin',
      updatedAt: '2024-10-15T10:30:00.000Z',
      更新者: 'admin',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('営業目標');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe('string');

    // ISO 8601 形式の確認
    const deletedDate = new Date(result.deletedAt);
    expect(deletedDate.toString()).not.toBe('Invalid Date');

    // deleteRecord が呼ばれたことを確認
    expect(dataStore.deleteRecord).toHaveBeenCalledWith(targetTableName, targetRecordId);
  });
});
