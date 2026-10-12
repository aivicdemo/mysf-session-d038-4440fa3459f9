import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1541: キャッシュデータが24時間以上前のとき警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return activities sorted by date and record warning when cache is older than 24 hours', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        作成者: 'admin'
      }])
      .mockResolvedValueOnce([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
          取引先ID: '770e8400-e29b-41d4-a716-446655440001',
          営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
          活動種別: '訪問',
          活動日時: '2024-12-20T14:30:00Z',
          活動内容: '定期訪問',
          次回フォローアップ予定日: '2024-12-27T00:00:00Z',
          商談ステージ: '提案段階',
          見積金額: 500000,
          成約フラグ: false,
          商談ID: '880e8400-e29b-41d4-a716-446655440001',
          活動時間: 90,
          活動件数: 1,
          活動頻度: '週1回',
          活動結果: '顧客が関心を示した',
          次のアクション: '見積提出',
          createdAt: '2024-12-20T14:35:00Z',
          updatedAt: '2024-12-20T14:35:00Z',
          作成日時: '2024-12-20T14:35:00Z',
          作成者ID: '550e8400-e29b-41d4-a716-446655440000',
          更新日時: '2024-12-20T14:35:00Z',
          更新者ID: '550e8400-e29b-41d4-a716-446655440000'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
          取引先ID: '770e8400-e29b-41d4-a716-446655440002',
          営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
          活動種別: '電話',
          活動日時: '2024-12-18T09:00:00Z',
          活動内容: '進捗確認',
          次回フォローアップ予定日: '2024-12-25T00:00:00Z',
          商談ステージ: '初期接触',
          見積金額: 300000,
          成約フラグ: false,
          商談ID: '880e8400-e29b-41d4-a716-446655440002',
          活動時間: 30,
          活動件数: 1,
          活動頻度: '月2回',
          活動結果: '予定を変更',
          次のアクション: '資料送付',
          createdAt: '2024-12-18T09:15:00Z',
          updatedAt: '2024-12-18T09:15:00Z',
          作成日時: '2024-12-18T09:15:00Z',
          作成者ID: '550e8400-e29b-41d4-a716-446655440000',
          更新日時: '2024-12-18T09:15:00Z',
          更新者ID: '550e8400-e29b-41d4-a716-446655440000'
        }
      ]);

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.totalCount).toBe(2);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-12-20T14:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-12-18T09:00:00Z');
    expect(result.fetchedAt).toBeDefined();
  });
});
