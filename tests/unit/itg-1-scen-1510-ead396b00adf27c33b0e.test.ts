import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1510: 過去の日付の営業活動データ取得に警告ログが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('過去の活動日時を含む営業活動レコード取得時に警告ログが記録される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '660e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        作成者: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440010',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440010',
        取引先ID: '770e8400-e29b-41d4-a716-446655440020',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        活動日時: '2025-01-15T10:30:00Z',
        活動内容: '顧客ヒアリング実施',
        次回フォローアップ予定日: '2025-01-20T00:00:00Z',
        商談ステージ: '提案',
        見積金額: 500000,
        成約フラグ: false,
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '880e8400-e29b-41d4-a716-446655440030',
        活動時間: 60,
        活動件数: 1,
        活動頻度: '週1回',
        活動結果: '要望確認',
        次のアクション: '見積書作成',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440011',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440011',
        取引先ID: '770e8400-e29b-41d4-a716-446655440021',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '訪問',
        活動日時: '2024-12-20T14:00:00Z',
        活動内容: '商品提案',
        次回フォローアップ予定日: '2024-12-27T00:00:00Z',
        商談ステージ: '商談中',
        見積金額: 300000,
        成約フラグ: false,
        createdAt: '2024-12-20T14:00:00Z',
        updatedAt: '2024-12-20T14:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '880e8400-e29b-41d4-a716-446655440031',
        活動時間: 90,
        活動件数: 1,
        活動頻度: '週1回',
        活動結果: '好反応',
        次のアクション: 'デモンストレーション',
      },
    ];

    (dataPersistence.listRecords as jest.Mock)
      .mockResolvedValueOnce(salesRepresentatives)
      .mockResolvedValueOnce(activities);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-12-20T14:00:00Z');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
