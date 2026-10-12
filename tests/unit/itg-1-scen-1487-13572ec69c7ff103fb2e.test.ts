import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1487: 商談ステージ別進捗データを取得して件数・金額・達成度の集計対象データが準備される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('商談ステージを含むデータが活動日時の降順で返される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440001';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440002',
        ステータス: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440001',
        取引先ID: '770e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        活動種別: '電話営業',
        activityType: '電話営業',
        活動日時: '2024-12-15T14:30:00Z',
        activityDateTime: '2024-12-15T14:30:00Z',
        活動内容: '新規取引先への営業提案',
        activityContent: '新規取引先への営業提案',
        次回フォローアップ予定日: '2024-12-20T10:00:00Z',
        nextFollowUpScheduledDate: '2024-12-20T10:00:00Z',
        商談ステージ: '提案',
        商談ID: '880e8400-e29b-41d4-a716-446655440001',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        見積金額: 500000,
        estimatedAmount: 500000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-12-15T14:30:00Z',
        updatedAt: '2024-12-15T14:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        更新者ID: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001',
        活動時間: 30,
        activityDurationMinutes: 30,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '初回接触',
        activityFrequency: '初回接触',
        活動結果: '提案資料提出済み',
        activityResult: '提案資料提出済み',
        次のアクション: '2日後にフォローアップ電話',
        nextAction: '2日後にフォローアップ電話',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        取引先ID: '770e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        活動種別: '訪問営業',
        activityType: '訪問営業',
        活動日時: '2024-12-10T10:00:00Z',
        activityDateTime: '2024-12-10T10:00:00Z',
        活動内容: '既存顧客との契約更新打ち合わせ',
        activityContent: '既存顧客との契約更新打ち合わせ',
        次回フォローアップ予定日: '2024-12-25T14:00:00Z',
        nextFollowUpScheduledDate: '2024-12-25T14:00:00Z',
        商談ステージ: '契約交渉中',
        商談ID: '880e8400-e29b-41d4-a716-446655440002',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        見積金額: 1200000,
        estimatedAmount: 1200000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-12-10T10:00:00Z',
        updatedAt: '2024-12-10T10:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        更新者ID: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001',
        活動時間: 60,
        activityDurationMinutes: 60,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '定期接触',
        activityFrequency: '定期接触',
        活動結果: '契約更新条件を協議',
        activityResult: '契約更新条件を協議',
        次のアクション: '見積書を修正して提出',
        nextAction: '見積書を修正して提出',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440003',
        customerId: '770e8400-e29b-41d4-a716-446655440003',
        取引先ID: '770e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        活動種別: 'メール営業',
        activityType: 'メール営業',
        活動日時: '2024-12-05T09:15:00Z',
        activityDateTime: '2024-12-05T09:15:00Z',
        活動内容: '新商品の案内メール送付',
        activityContent: '新商品の案内メール送付',
        次回フォローアップ予定日: '2024-12-12T11:00:00Z',
        nextFollowUpScheduledDate: '2024-12-12T11:00:00Z',
        商談ステージ: '見込み客',
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        見積金額: 300000,
        estimatedAmount: 300000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-12-05T09:15:00Z',
        updatedAt: '2024-12-05T09:15:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        更新者ID: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001',
        活動時間: 15,
        activityDurationMinutes: 15,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '新規接触',
        activityFrequency: '新規接触',
        活動結果: 'メール既読確認',
        activityResult: 'メール既読確認',
        次のアクション: '1週間後に電話フォロー',
        nextAction: '1週間後に電話フォロー',
      },
    ];

    const mockListRecords = jest.fn((tableName: string) => {
      if (tableName === 'sales_representative') {
        return Promise.resolve(salesRepresentatives);
      }
      if (tableName === 'activity') {
        return Promise.resolve(activities);
      }
      return Promise.resolve([]);
    });

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.totalCount).toBe(3);
    expect(result.activities).toHaveLength(3);

    // 活動日時の降順を確認（最新順：2024-12-15 → 2024-12-10 → 2024-12-05）
    expect(result.activities[0].activityDateTime).toBe('2024-12-15T14:30:00Z');
    expect(result.activities[0].activityType).toBe('電話営業');
    expect(result.activities[0].estimatedAmount).toBe(500000);

    expect(result.activities[1].activityDateTime).toBe('2024-12-10T10:00:00Z');
    expect(result.activities[1].activityType).toBe('訪問営業');
    expect(result.activities[1].estimatedAmount).toBe(1200000);

    expect(result.activities[2].activityDateTime).toBe('2024-12-05T09:15:00Z');
    expect(result.activities[2].activityType).toBe('メール営業');

    // 全フィールドが含まれていることを確認
    result.activities.forEach((activity) => {
      expect(activity).toHaveProperty('activityId');
      expect(activity).toHaveProperty('salesRepresentativeId');
      expect(activity).toHaveProperty('activityType');
      expect(activity).toHaveProperty('activityDateTime');
      expect(activity).toHaveProperty('estimatedAmount');
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z$/);
  });
});
