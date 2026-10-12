import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1540: 経過時間が負の値になった場合例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when activity duration is negative', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '田中太郎',
        メールアドレス: 'tanaka@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '660e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        作成日時: '2024-01-01T10:00:00Z',
        更新日時: '2024-01-01T10:00:00Z',
        作成者: 'admin'
      }])
      .mockResolvedValueOnce([{
        id: '770e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '770e8400-e29b-41d4-a716-446655440002',
        取引先ID: '880e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: 'phone_call',
        活動日時: '2024-06-15T14:30:00Z',
        活動内容: '顧客との電話打ち合わせ',
        次回フォローアップ予定日: '2024-06-20T10:00:00Z',
        商談ステージ: 'proposal',
        見積金額: 500000,
        成約フラグ: false,
        作成日時: '2024-06-15T14:31:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2024-06-15T14:31:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '990e8400-e29b-41d4-a716-446655440004',
        活動時間: -30,
        活動件数: 1,
        活動頻度: 'weekly',
        活動結果: '進捗あり',
        次のアクション: '提案資料送付'
      }]);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow(DataStoreError);

    try {
      await fetchActivitiesByRepresentative({ salesRepresentativeId });
    } catch (error) {
      if (error instanceof DataStoreError) {
        expect(error.message).toBe('営業活動データの取得に失敗しました。');
      }
    }
  });
});
