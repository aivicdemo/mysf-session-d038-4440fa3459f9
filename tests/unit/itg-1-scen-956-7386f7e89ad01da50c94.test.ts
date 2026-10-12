import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-956: 営業活動レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する営業活動レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const mockActivityRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業活動ID: '550e8400-e29b-41d4-a716-446655440000',
      取引先ID: '550e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
      活動種別: '電話',
      活動日時: '2026-10-07T10:00:00Z',
      活動内容: '顧客への初回接触',
      次回フォローアップ予定日: '2026-10-14T10:00:00Z',
      商談ステージ: '初期段階',
      見積金額: 500000,
      成約フラグ: false,
      createdAt: '2026-10-01T09:00:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440003',
      updatedAt: '2026-10-05T14:30:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440003',
      商談ID: '550e8400-e29b-41d4-a716-446655440004',
      活動時間: 60,
      活動件数: 1,
      活動頻度: '週1回',
      活動結果: '連絡取れず',
      次のアクション: 'メール送信予定',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockActivityRecord])
      .mockResolvedValueOnce([]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName: '営業活動',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.targetTableName).toBe('営業活動');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
    expect(dataStore.deleteRecord).toHaveBeenCalledWith('営業活動', '550e8400-e29b-41d4-a716-446655440000');
  });
});
