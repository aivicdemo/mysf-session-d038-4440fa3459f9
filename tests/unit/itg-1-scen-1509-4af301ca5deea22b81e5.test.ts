import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1509: 営業活動レコードを正常に取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者IDが有効な場合、該当する営業活動レコードを活動日時の降順で返す', async () => {
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
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
      },
    ];

    const activities = [
      {
        id: '650e8400-e29b-41d4-a716-446655440000',
        営業活動ID: '650e8400-e29b-41d4-a716-446655440000',
        取引先ID: '750e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        活動日時: '2024-01-15T10:30:00Z',
        活動内容: '営業提案の説明',
        次回フォローアップ予定日: '2024-01-22T00:00:00Z',
        商談ステージ: '提案段階',
        見積金額: 500000,
        成約フラグ: false,
        作成日時: '2024-01-15T10:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2024-01-15T10:30:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '850e8400-e29b-41d4-a716-446655440000',
        活動時間: 30,
        活動件数: 1,
        活動頻度: '週1回',
        活動結果: '継続検討中',
        次のアクション: '資料送付',
      },
    ];

    (dataPersistence.listRecords as jest.Mock)
      .mockResolvedValueOnce(salesRepresentatives)
      .mockResolvedValueOnce(activities);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].activityDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
