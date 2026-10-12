import { deleteRecord, RecordNotFoundError, InvalidTableNameError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-958: deleteRecord - 商談ステージマスタレコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する商談ステージマスタレコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = '商談ステージマスタ';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ステージID: '550e8400-e29b-41d4-a716-446655440000',
      ステージ名: '提案段階',
      ステージ順序: 2,
      説明: '営業提案を実施した段階',
      成約ステージフラグ: false,
      失注ステージフラグ: false,
      有効フラグ: true,
      作成日時: '2025-01-15T09:00:00Z',
      更新日時: '2025-01-15T09:00:00Z',
      作成者: 'system',
      更新者: 'system',
      createdAt: '2025-01-15T09:00:00Z',
      updatedAt: '2025-01-15T09:00:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('商談ステージマスタ');
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
