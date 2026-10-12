import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1488: 営業担当者ごとの売上目標値を取得して実績との差分計算に必要なベースラインが確保される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('指定した営業担当者IDのみのデータが返される', async () => {
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
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        作成者: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440001',
        取引先ID: '770e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        activityType: '電話',
        活動日時: '2024-01-20T14:30:00Z',
        activityDateTime: '2024-01-20T14:30:00Z',
        活動内容: '新規案件ヒアリング実施',
        activityContent: '新規案件ヒアリング実施',
        次回フォローアップ予定日: '2024-01-27T09:00:00Z',
        nextFollowUpScheduledDate: '2024-01-27T09:00:00Z',
        商談ステージ: '提案',
        商談ID: '880e8400-e29b-41d4-a716-446655440001',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        見積金額: 1500000,
        estimatedAmount: 1500000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-20T14:30:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 45,
        activityDurationMinutes: 45,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '週1回',
        activityFrequency: '週1回',
        活動結果: '見積提示予定',
        activityResult: '見積提示予定',
        次のアクション: '見積書作成',
        nextAction: '見積書作成',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        取引先ID: '770e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '訪問',
        activityType: '訪問',
        活動日時: '2024-01-18T10:00:00Z',
        activityDateTime: '2024-01-18T10:00:00Z',
        活動内容: '既存顧客フォローアップ',
        activityContent: '既存顧客フォローアップ',
        次回フォローアップ予定日: '2024-02-01T09:00:00Z',
        nextFollowUpScheduledDate: '2024-02-01T09:00:00Z',
        商談ステージ: '交渉中',
        商談ID: '880e8400-e29b-41d4-a716-446655440002',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        見積金額: 3000000,
        estimatedAmount: 3000000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-18T10:00:00Z',
        updatedAt: '2024-01-18T10:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 120,
        activityDurationMinutes: 120,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '月2回',
        activityFrequency: '月2回',
        活動結果: '契約予定確認',
        activityResult: '契約予定確認',
        次のアクション: '契約書準備',
        nextAction: '契約書準備',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440003',
        customerId: '770e8400-e29b-41d4-a716-446655440003',
        取引先ID: '770e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440099',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440099',
        活動種別: 'メール',
        activityType: 'メール',
        活動日時: '2024-01-15T16:00:00Z',
        activityDateTime: '2024-01-15T16:00:00Z',
        活動内容: '別営業担当者の活動',
        activityContent: '別営業担当者の活動',
        次回フォローアップ予定日: '2024-01-22T09:00:00Z',
        nextFollowUpScheduledDate: '2024-01-22T09:00:00Z',
        商談ステージ: '見込み',
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        見積金額: 500000,
        estimatedAmount: 500000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-15T16:00:00Z',
        updatedAt: '2024-01-15T16:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440099',
        createdBy: '550e8400-e29b-41d4-a716-446655440099',
        更新者ID: '550e8400-e29b-41d4-a716-446655440099',
        updatedBy: '550e8400-e29b-41d4-a716-446655440099',
        活動時間: 15,
        activityDurationMinutes: 15,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '不定期',
        activityFrequency: '不定期',
        活動結果: '資料送付',
        activityResult: '資料送付',
        次のアクション: '回答待ち',
        nextAction: '回答待ち',
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

    // 指定した営業担当者IDのみのレコードが返されること
    expect(result.activities[0].salesRepresentativeId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.activities[0].activityId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.activities[0].activityDateTime).toBe('2024-01-20T14:30:00Z');
    expect(result.activities[0].estimatedAmount).toBe(1500000);

    expect(result.activities[1].salesRepresentativeId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.activities[1].activityId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result.activities[1].activityDateTime).toBe('2024-01-18T10:00:00Z');
    expect(result.activities[1].estimatedAmount).toBe(3000000);

    // 別営業担当者のレコードは除外される
    expect(result.activities).not.toContainEqual(
      expect.objectContaining({
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440099',
      })
    );

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z$/);
  });
});
