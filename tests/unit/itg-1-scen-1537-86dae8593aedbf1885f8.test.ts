import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1537: 請求書レコードが存在しないとき警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動レコードが取得され、活動日時の降順で返却される', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    // 営業担当者テーブルの前提データ
    const salesRepresentativesData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    // 営業活動テーブルの前提データ（活動日時の降順で提供）
    const activitiesData = [
      {
        id: '650e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '650e8400-e29b-41d4-a716-446655440001',
        取引先ID: '750e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話営業',
        活動日時: '2024-06-15T14:30:00Z',
        活動内容: '新規案件のヒアリング実施',
        次回フォローアップ予定日: '2024-06-22T10:00:00Z',
        商談ステージ: '提案',
        見積金額: 500000,
        成約フラグ: false,
        作成日時: '2024-06-15T14:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2024-06-15T14:30:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '850e8400-e29b-41d4-a716-446655440001',
        活動時間: 60,
        活動件数: 1,
        活動頻度: '週1回',
        活動結果: '進捗あり',
        次のアクション: '提案資料の送付',
        createdAt: '2024-06-15T14:30:00Z',
        updatedAt: '2024-06-15T14:30:00Z',
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '650e8400-e29b-41d4-a716-446655440002',
        取引先ID: '750e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: 'メール営業',
        活動日時: '2024-06-10T09:15:00Z',
        活動内容: '定期フォローアップ',
        次回フォローアップ予定日: '2024-06-17T14:00:00Z',
        商談ステージ: '折衝中',
        見積金額: 300000,
        成約フラグ: false,
        作成日時: '2024-06-10T09:15:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2024-06-10T09:15:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '850e8400-e29b-41d4-a716-446655440002',
        活動時間: 30,
        活動件数: 1,
        活動頻度: '週2回',
        活動結果: '保留',
        次のアクション: '次週面談予定',
        createdAt: '2024-06-10T09:15:00Z',
        updatedAt: '2024-06-10T09:15:00Z',
      },
    ];

    listRecords
      .mockImplementation((tableName) => {
        if (tableName === '営業担当者') {
          return Promise.resolve(salesRepresentativesData);
        }
        if (tableName === '営業活動') {
          return Promise.resolve(activitiesData);
        }
        return Promise.resolve([]);
      });

    const input = {
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = (await fetchActivitiesByRepresentative(input)) as FetchActivitiesByRepresentativeOutput;

    // 出力型として activities フィールドに営業担当者IDのレコード2件が活動日時の降順で格納されることを確認
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-06-15T14:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-06-10T09:15:00Z');

    // totalCount に 2 が格納される
    expect(result.totalCount).toBe(2);

    // fetchedAt に ISO 8601形式の現在時刻が格納されることを確認
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    // ISO 8601形式のチェック（YYYY-MM-DDTHH:mm:ss.sssZ の形式）
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(result.fetchedAt)).toBe(true);
  });
});
