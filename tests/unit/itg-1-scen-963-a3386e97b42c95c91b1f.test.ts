import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-963: deleteRecord - ユーザー権限レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在するユーザー権限レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = 'ユーザー権限';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      権限ID: '550e8400-e29b-41d4-a716-446655440000',
      ユーザーID: '550e8400-e29b-41d4-a716-446655440001',
      権限コード: 'SALES_VIEW',
      権限名: '営業情報閲覧',
      説明: '営業活動情報の閲覧権限',
      有効フラグ: true,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-15T14:30:00Z',
      作成日時: '2026-01-01T10:00:00Z',
      更新日時: '2026-01-15T14:30:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440010',
      更新者: '550e8400-e29b-41d4-a716-446655440010',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('ユーザー権限');
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
