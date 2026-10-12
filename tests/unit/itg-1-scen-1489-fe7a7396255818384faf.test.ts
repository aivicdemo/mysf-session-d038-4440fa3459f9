import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1489: 営業担当者別活動実績と商談ステージ別進捗が集計されて目標値との差分が自動計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('営業担当者IDでフィルタリングされたデータが活動日時の降順で返される', async () => {
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
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
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
        活動種別: '訪問',
        activityType: '訪問',
        活動日時: '2024-01-15T14:30:00Z',
        activityDateTime: '2024-01-15T14:30:00Z',
        活動内容: '顧客との打ち合わせ',
        activityContent: '顧客との打ち合わせ',
        次回フォローアップ予定日: '2024-01-22T00:00:00Z',
        nextFollowUpScheduledDate: '2024-01-22T00:00:00Z',
        商談ステージ: '提案',
        商談ID: '880e8400-e29b-41d4-a716-446655440001',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        見積金額: 500000,
        estimatedAmount: 500000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-15T14:35:00Z',
        updatedAt: '2024-01-15T14:35:00Z',
        作成日時: '2024-01-15T14:35:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2024-01-15T14:35:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 60,
        activityDurationMinutes: 60,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '定期',
        activityFrequency: '定期',
        活動結果: '合意取得',
        activityResult: '合意取得',
        次のアクション: '見積提出',
        nextAction: '見積提出',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        取引先ID: '770e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        activityType: '電話',
        活動日時: '2024-01-14T10:15:00Z',
        activityDateTime: '2024-01-14T10:15:00Z',
        活動内容: '進捗確認',
        activityContent: '進捗確認',
        次回フォローアップ予定日: '2024-01-21T00:00:00Z',
        nextFollowUpScheduledDate: '2024-01-21T00:00:00Z',
        商談ステージ: '受注',
        商談ID: '880e8400-e29b-41d4-a716-446655440002',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        見積金額: 1200000,
        estimatedAmount: 1200000,
        成約フラグ: true,
        contractedFlag: true,
        createdAt: '2024-01-14T10:20:00Z',
        updatedAt: '2024-01-14T10:20:00Z',
        作成日時: '2024-01-14T10:20:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2024-01-14T10:20:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        updatedBy: '550e8400-e29b-41d4-a716-446655440000',
        活動時間: 30,
        activityDurationMinutes: 30,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '随時',
        activityFrequency: '随時',
        活動結果: '受注確定',
        activityResult: '受注確定',
        次のアクション: '請求書作成',
        nextAction: '請求書作成',
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
        活動日時: '2024-01-13T09:00:00Z',
        activityDateTime: '2024-01-13T09:00:00Z',
        活動内容: '資料送付',
        activityContent: '資料送付',
        次回フォローアップ予定日: '2024-01-20T00:00:00Z',
        nextFollowUpScheduledDate: '2024-01-20T00:00:00Z',
        商談ステージ: '初期接触',
        商談ID: '880e8400-e29b-41d4-a716-446655440003',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        見積金額: 300000,
        estimatedAmount: 300000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-01-13T09:05:00Z',
        updatedAt: '2024-01-13T09:05:00Z',
        作成日時: '2024-01-13T09:05:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440001',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        更新日時: '2024-01-13T09:05:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001',
        活動時間: 15,
        activityDurationMinutes: 15,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '随時',
        activityFrequency: '随時',
        活動結果: '送付完了',
        activityResult: '送付完了',
        次のアクション: '反応確認',
        nextAction: '反応確認',
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

    // 営業担当者ID '550e8400-e29b-41d4-a716-446655440000' に属するレコードのみ返される
    expect(result.activities[0].salesRepresentativeId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.activities[0].activityId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.activities[0].activityDateTime).toBe('2024-01-15T14:30:00Z');
    expect(result.activities[0].estimatedAmount).toBe(500000);

    expect(result.activities[1].salesRepresentativeId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.activities[1].activityId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result.activities[1].activityDateTime).toBe('2024-01-14T10:15:00Z');
    expect(result.activities[1].estimatedAmount).toBe(1200000);

    // 営業担当者ID '550e8400-e29b-41d4-a716-446655440001' のレコードは含まれない
    expect(result.activities).not.toContainEqual(
      expect.objectContaining({
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
      })
    );

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z$/);
  });
});
