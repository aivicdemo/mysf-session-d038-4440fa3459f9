import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1485: 営業プロセス統合ダッシュボード生成フロー全体が処理連鎖として実行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('指定した営業担当者IDの活動が活動日時の降順で取得される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
    const now = new Date().toISOString();

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
        createdAt: '2025-01-01T09:00:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
        作成者: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440100',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440100',
        customerId: '770e8400-e29b-41d4-a716-446655440200',
        取引先ID: '770e8400-e29b-41d4-a716-446655440200',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '訪問',
        activityType: '訪問',
        活動日時: '2025-01-15T14:30:00.000Z',
        activityDateTime: '2025-01-15T14:30:00.000Z',
        活動内容: '製品説明会実施',
        activityContent: '製品説明会実施',
        次回フォローアップ予定日: '2025-01-22T00:00:00.000Z',
        nextFollowUpScheduledDate: '2025-01-22T00:00:00.000Z',
        商談ステージ: '提案',
        商談ID: '880e8400-e29b-41d4-a716-446655440300',
        dealId: '880e8400-e29b-41d4-a716-446655440300',
        見積金額: 500000,
        estimatedAmount: 500000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2025-01-15T14:35:00.000Z',
        updatedAt: '2025-01-15T14:35:00.000Z',
        作成日時: '2025-01-15T14:35:00.000Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2025-01-15T14:35:00.000Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 120,
        activityDurationMinutes: 120,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '週1回',
        activityFrequency: '週1回',
        活動結果: '成功',
        activityResult: '成功',
        次のアクション: '提案資料送付',
        nextAction: '提案資料送付',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440101',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440101',
        customerId: '770e8400-e29b-41d4-a716-446655440201',
        取引先ID: '770e8400-e29b-41d4-a716-446655440201',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        activityType: '電話',
        活動日時: '2025-01-14T10:15:00.000Z',
        activityDateTime: '2025-01-14T10:15:00.000Z',
        活動内容: '商品問合せ対応',
        activityContent: '商品問合せ対応',
        次回フォローアップ予定日: '2025-01-21T00:00:00.000Z',
        nextFollowUpScheduledDate: '2025-01-21T00:00:00.000Z',
        商談ステージ: '初期接触',
        商談ID: '880e8400-e29b-41d4-a716-446655440301',
        dealId: '880e8400-e29b-41d4-a716-446655440301',
        見積金額: 300000,
        estimatedAmount: 300000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2025-01-14T10:20:00.000Z',
        updatedAt: '2025-01-14T10:20:00.000Z',
        作成日時: '2025-01-14T10:20:00.000Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2025-01-14T10:20:00.000Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 30,
        activityDurationMinutes: 30,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '不定期',
        activityFrequency: '不定期',
        活動結果: '成功',
        activityResult: '成功',
        次のアクション: '見積提示',
        nextAction: '見積提示',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440102',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440102',
        customerId: '770e8400-e29b-41d4-a716-446655440202',
        取引先ID: '770e8400-e29b-41d4-a716-446655440202',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
        活動種別: 'メール',
        activityType: 'メール',
        活動日時: '2025-01-13T11:00:00.000Z',
        activityDateTime: '2025-01-13T11:00:00.000Z',
        活動内容: '送付状況確認',
        activityContent: '送付状況確認',
        次回フォローアップ予定日: '2025-01-20T00:00:00.000Z',
        nextFollowUpScheduledDate: '2025-01-20T00:00:00.000Z',
        商談ステージ: '検討中',
        商談ID: '880e8400-e29b-41d4-a716-446655440302',
        dealId: '880e8400-e29b-41d4-a716-446655440302',
        見積金額: 250000,
        estimatedAmount: 250000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2025-01-13T11:05:00.000Z',
        updatedAt: '2025-01-13T11:05:00.000Z',
        作成日時: '2025-01-13T11:05:00.000Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440002',
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        更新日時: '2025-01-13T11:05:00.000Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440002',
        updatedBy: '550e8400-e29b-41d4-a716-446655440002',
        活動時間: 15,
        activityDurationMinutes: 15,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '週2回',
        activityFrequency: '週2回',
        活動結果: '成功',
        activityResult: '成功',
        次のアクション: '追加提案',
        nextAction: '追加提案',
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

    // 活動日時の降順を確認
    expect(result.activities[0].activityDateTime).toBe('2025-01-15T14:30:00.000Z');
    expect(result.activities[0].activityContent).toBe('製品説明会実施');

    expect(result.activities[1].activityDateTime).toBe('2025-01-14T10:15:00.000Z');
    expect(result.activities[1].activityContent).toBe('商品問合せ対応');

    // fetchedAt が現在時刻の ISO 8601 形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
