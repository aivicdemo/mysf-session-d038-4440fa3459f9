import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1486: 営業担当者別活動実績データを取得して件数・頻度の集計対象データが準備される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('活動件数・活動頻度を含むデータが活動日時の降順で返される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '田中太郎',
        メールアドレス: 'tanaka@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
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
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        activityType: '電話',
        活動日時: '2024-01-15T14:30:00Z',
        activityDateTime: '2024-01-15T14:30:00Z',
        活動内容: '新規案件のヒアリング',
        activityContent: '新規案件のヒアリング',
        次回フォローアップ予定日: '2024-01-22T00:00:00Z',
        nextFollowUpScheduledDate: '2024-01-22T00:00:00Z',
        商談ステージ: '提案',
        商談ID: '880e8400-e29b-41d4-a716-446655440001',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        見積金額: 500000,
        estimatedAmount: 500000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 30,
        activityDurationMinutes: 30,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '高',
        activityFrequency: '高',
        活動結果: '対応待ち',
        activityResult: '対応待ち',
        次のアクション: '提案資料送付',
        nextAction: '提案資料送付',
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
        活動日時: '2024-01-10T10:00:00Z',
        activityDateTime: '2024-01-10T10:00:00Z',
        活動内容: '既存顧客フォローアップ',
        activityContent: '既存顧客フォローアップ',
        次回フォローアップ予定日: '2024-01-31T00:00:00Z',
        nextFollowUpScheduledDate: '2024-01-31T00:00:00Z',
        商談ステージ: '受注',
        商談ID: '880e8400-e29b-41d4-a716-446655440002',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        見積金額: 1200000,
        estimatedAmount: 1200000,
        成約フラグ: true,
        contractedFlag: true,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 60,
        activityDurationMinutes: 60,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '中',
        activityFrequency: '中',
        活動結果: '成約',
        activityResult: '成約',
        次のアクション: '請求書発行',
        nextAction: '請求書発行',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440003',
        customerId: '770e8400-e29b-41d4-a716-446655440003',
        取引先ID: '770e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
        活動種別: 'メール',
        activityType: 'メール',
        活動日時: '2024-01-08T09:00:00Z',
        activityDateTime: '2024-01-08T09:00:00Z',
        活動内容: '見積依頼',
        activityContent: '見積依頼',
        次回フォローアップ予定日: '2024-01-15T00:00:00Z',
        nextFollowUpScheduledDate: '2024-01-15T00:00:00Z',
        商談ステージ: '初期接触',
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        見積金額: 300000,
        estimatedAmount: 300000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-08T09:00:00Z',
        updatedAt: '2024-01-08T09:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        更新者ID: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001',
        活動時間: 10,
        activityDurationMinutes: 10,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '低',
        activityFrequency: '低',
        活動結果: '送信完了',
        activityResult: '送信完了',
        次のアクション: '返信待ち',
        nextAction: '返信待ち',
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
    expect(result.activities[0].activityDateTime).toBe('2024-01-15T14:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-01-10T10:00:00Z');

    // 集計対象データ（活動件数・活動頻度）が含まれていることを確認
    expect(result.activities[0].activityCount).toBe(1);
    expect(result.activities[0].activityFrequency).toBe('高');

    expect(result.activities[1].activityCount).toBe(1);
    expect(result.activities[1].activityFrequency).toBe('中');

    // SaveActivityOutput の全フィールドが含まれていることを確認
    expect(result.activities[0]).toHaveProperty('activityId');
    expect(result.activities[0]).toHaveProperty('activityType');
    expect(result.activities[0]).toHaveProperty('activityDurationMinutes');
    expect(result.activities[0]).toHaveProperty('activityResult');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z$/);
  });
});
