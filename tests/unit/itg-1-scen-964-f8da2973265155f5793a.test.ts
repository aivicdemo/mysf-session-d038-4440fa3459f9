import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-964: deleteRecord - データ検証ルールレコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在するデータ検証ルールレコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = 'データ検証ルール';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      検証ルールID: '550e8400-e29b-41d4-a716-446655440000',
      ルール名: '請求金額の妥当性チェック',
      ルール説明: '請求金額が営業活動の見積金額と一致することを検証',
      対象テーブル: '請求書',
      対象カラム: '請求金額',
      検証タイプ: '参照整合性',
      検証条件: '請求金額 = SUM(営業活動.見積金額)',
      エラーメッセージ: '請求金額が見積金額と不一致です',
      警告レベル: '高',
      有効フラグ: true,
      適用開始日: '2025-01-01T00:00:00Z',
      適用終了日: null,
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      作成日時: '2025-01-15T10:30:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440001',
      更新日時: '2025-01-15T10:30:00Z',
      更新者: '550e8400-e29b-41d4-a716-446655440001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('データ検証ルール');
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
