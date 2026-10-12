import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1490: 全データフロー（取引先→責任者→活動→商談→請求）で金額ズレ・ステータス不整合・未完了案件などの異常が自動検知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('営業活動が活動日時の降順で返され、ISO 8601形式のタイムスタンプが取得される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440001';

    const salesRepresentatives = [
      {
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        id: '550e8400-e29b-41d4-a716-446655440001',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440099',
        ステータス: 'active',
      },
    ];

    const activities = [
      {
        営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
        id: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440001',
        取引先ID: '770e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        活動種別: '電話',
        activityType: '電話',
        活動日時: '2026-10-07T10:30:00Z',
        activityDateTime: '2026-10-07T10:30:00Z',
        活動内容: '顧客への進捗確認',
        activityContent: '顧客への進捗確認',
        次回フォローアップ予定日: '2026-10-14T00:00:00Z',
        nextFollowUpScheduledDate: '2026-10-14T00:00:00Z',
        商談ステージ: '提案済み',
        商談ID: '880e8400-e29b-41d4-a716-446655440001',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        見積金額: 500000,
        estimatedAmount: 500000,
        成約フラグ: false,
        contractedFlag: false,
        活動時間: 30,
        activityDurationMinutes: 30,
        活動件数: 1,
        activityCount: 1,
        活動頻度: 'weekly',
        activityFrequency: 'weekly',
        活動結果: '前進',
        activityResult: '前進',
        次のアクション: '提案資料の修正版を送付',
        nextAction: '提案資料の修正版を送付',
      },
      {
        営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
        id: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        取引先ID: '770e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        活動種別: '訪問',
        activityType: '訪問',
        活動日時: '2026-10-05T14:00:00Z',
        activityDateTime: '2026-10-05T14:00:00Z',
        活動内容: 'ニーズヒアリング',
        activityContent: 'ニーズヒアリング',
        次回フォローアップ予定日: '2026-10-12T00:00:00Z',
        nextFollowUpScheduledDate: '2026-10-12T00:00:00Z',
        商談ステージ: 'ニーズ把握',
        商談ID: '880e8400-e29b-41d4-a716-446655440002',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        見積金額: 300000,
        estimatedAmount: 300000,
        成約フラグ: false,
        contractedFlag: false,
        活動時間: 60,
        activityDurationMinutes: 60,
        活動件数: 1,
        activityCount: 1,
        活動頻度: 'once',
        activityFrequency: 'once',
        活動結果: '情報取得',
        activityResult: '情報取得',
        次のアクション: '提案資料の作成',
        nextAction: '提案資料の作成',
      },
      {
        営業活動ID: '660e8400-e29b-41d4-a716-446655440003',
        id: '660e8400-e29b-41d4-a716-446655440003',
        customerId: '770e8400-e29b-41d4-a716-446655440003',
        取引先ID: '770e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
        活動種別: 'メール',
        activityType: 'メール',
        活動日時: '2026-10-06T09:00:00Z',
        activityDateTime: '2026-10-06T09:00:00Z',
        活動内容: 'フォローアップメール送信',
        activityContent: 'フォローアップメール送信',
        次回フォローアップ予定日: '2026-10-13T00:00:00Z',
        nextFollowUpScheduledDate: '2026-10-13T00:00:00Z',
        商談ステージ: '初期段階',
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        見積金額: 100000,
        estimatedAmount: 100000,
        成約フラグ: false,
        contractedFlag: false,
        活動時間: 10,
        activityDurationMinutes: 10,
        活動件数: 1,
        activityCount: 1,
        活動頻度: 'once',
        activityFrequency: 'once',
        活動結果: '未返信',
        activityResult: '未返信',
        次のアクション: '再度連絡',
        nextAction: '再度連絡',
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

    expect(result.totalCount).toBe(2);
    expect(result.activities).toHaveLength(2);

    // 活動日時の降順を確認（新しい順）
    expect(result.activities[0].activityDateTime).toBe('2026-10-07T10:30:00Z');
    expect(result.activities[0].salesRepresentativeId).toBe('550e8400-e29b-41d4-a716-446655440001');

    expect(result.activities[1].activityDateTime).toBe('2026-10-05T14:00:00Z');
    expect(result.activities[1].salesRepresentativeId).toBe('550e8400-e29b-41d4-a716-446655440001');

    // fetchedAt が ISO 8601 形式のタイムスタンプであることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z$/);
  });
});
