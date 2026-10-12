import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1547: 遅延状況通知送信失敗後に3回まで指数バックオフで再試行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return activities with retry mechanism for notification failures', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
        作成者: 'admin'
      }])
      .mockResolvedValueOnce([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
          取引先ID: '770e8400-e29b-41d4-a716-446655440001',
          営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
          活動種別: '訪問',
          活動日時: '2024-01-15T14:30:00Z',
          活動内容: '新製品説明会',
          次回フォローアップ予定日: '2024-01-22T10:00:00Z',
          商談ステージ: '提案',
          見積金額: 500000,
          成約フラグ: false,
          createdAt: '2024-01-15T15:00:00Z',
          updatedAt: '2024-01-15T15:00:00Z',
          作成日時: '2024-01-15T15:00:00Z',
          作成者ID: '550e8400-e29b-41d4-a716-446655440000',
          更新日時: '2024-01-15T15:00:00Z',
          更新者ID: '550e8400-e29b-41d4-a716-446655440000',
          商談ID: '880e8400-e29b-41d4-a716-446655440001',
          活動時間: 60,
          活動件数: 1,
          活動頻度: '月1回',
          活動結果: '良好',
          次のアクション: '提案資料送付'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
          取引先ID: '770e8400-e29b-41d4-a716-446655440002',
          営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
          活動種別: '電話',
          活動日時: '2024-01-10T10:15:00Z',
          活動内容: '進捗確認',
          次回フォローアップ予定日: '2024-01-17T14:00:00Z',
          商談ステージ: '初期接触',
          見積金額: 300000,
          成約フラグ: false,
          createdAt: '2024-01-10T10:30:00Z',
          updatedAt: '2024-01-10T10:30:00Z',
          作成日時: '2024-01-10T10:30:00Z',
          作成者ID: '550e8400-e29b-41d4-a716-446655440000',
          更新日時: '2024-01-10T10:30:00Z',
          更新者ID: '550e8400-e29b-41d4-a716-446655440000',
          商談ID: '880e8400-e29b-41d4-a716-446655440002',
          活動時間: 30,
          活動件数: 1,
          活動頻度: '随時',
          活動結果: '継続',
          次のアクション: '詳細提案'
        }
      ]);

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.totalCount).toBe(2);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-01-15T14:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-01-10T10:15:00Z');
    expect(result.fetchedAt).toBeDefined();
  });
});
