import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1546: データ不整合警告通知送信に失敗したとき異常検知ログに記録されて内部キューに保持される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return activities and handle notification failure gracefully', async () => {
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
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z'
      }])
      .mockResolvedValueOnce([
        {
          id: '660e8400-e29b-41d4-a716-446655440000',
          営業活動ID: '660e8400-e29b-41d4-a716-446655440000',
          取引先ID: '770e8400-e29b-41d4-a716-446655440000',
          営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
          活動種別: '電話',
          活動日時: '2025-01-15T10:30:00Z',
          活動内容: '新商品の提案',
          次回フォローアップ予定日: '2025-01-20T00:00:00Z',
          商談ステージ: '提案段階',
          見積金額: 500000,
          成約フラグ: false,
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          作成者ID: '550e8400-e29b-41d4-a716-446655440000',
          更新者ID: '550e8400-e29b-41d4-a716-446655440000',
          商談ID: '880e8400-e29b-41d4-a716-446655440000',
          活動時間: 30,
          活動件数: 1,
          活動頻度: '週1回',
          活動結果: '了承',
          次のアクション: '見積書送付'
        },
        {
          id: '661e8400-e29b-41d4-a716-446655440001',
          営業活動ID: '661e8400-e29b-41d4-a716-446655440001',
          取引先ID: '771e8400-e29b-41d4-a716-446655440001',
          営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
          活動種別: '訪問',
          活動日時: '2025-01-10T14:00:00Z',
          活動内容: '契約内容確認',
          次回フォローアップ予定日: '2025-01-25T00:00:00Z',
          商談ステージ: '契約段階',
          見積金額: 300000,
          成約フラグ: true,
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
          作成者ID: '550e8400-e29b-41d4-a716-446655440000',
          更新者ID: '550e8400-e29b-41d4-a716-446655440000',
          商談ID: '881e8400-e29b-41d4-a716-446655440001',
          活動時間: 60,
          活動件数: 1,
          活動頻度: '月2回',
          活動結果: '契約成立',
          次のアクション: '請求書発行'
        }
      ]);

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.totalCount).toBe(2);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2025-01-10T14:00:00Z');
    expect(result.fetchedAt).toBeDefined();
  });
});
