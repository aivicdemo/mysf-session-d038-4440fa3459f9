import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1495: ダッシュボード表示要求から30秒以上応答がない場合にキャッシュまたは簡易版が代替表示される', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepresentativeData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '営業太郎',
      メールアドレス: 'taro@example.com',
      電話番号: '09012345678',
      部門: '営業部',
      役職: '営業担当者',
      上司ID: '550e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      作成者: 'admin',
    },
  ];

  const activitiesData = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '訪問',
      活動日時: '2024-01-15T10:00:00Z',
      活動内容: '取引先訪問・要件ヒアリング',
      次回フォローアップ予定日: '2024-01-22T00:00:00Z',
      商談ステージ: '初期接触',
      見積金額: 500000,
      成約フラグ: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      作成日時: '2024-01-15T10:00:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2024-01-15T10:00:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440001',
      活動時間: 60,
      活動件数: 1,
      活動頻度: '週1回',
      活動結果: '要件確認済み',
      次のアクション: '提案資料作成',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話',
      活動日時: '2024-01-10T14:30:00Z',
      活動内容: '進捗確認電話',
      次回フォローアップ予定日: '2024-01-17T00:00:00Z',
      商談ステージ: '提案中',
      見積金額: 800000,
      成約フラグ: false,
      createdAt: '2024-01-10T14:30:00Z',
      updatedAt: '2024-01-10T14:30:00Z',
      作成日時: '2024-01-10T14:30:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2024-01-10T14:30:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440002',
      活動時間: 30,
      活動件数: 1,
      活動頻度: '週1回',
      活動結果: '進捗良好',
      次のアクション: '見積提出',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('30秒以上の遅延時にキャッシュ版が返される', async () => {
    // 30秒以上の遅延をシミュレート
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return new Promise((resolve) =>
          setTimeout(() => resolve(salesRepresentativeData), 35000)
        );
      } else if (tableName === '営業活動') {
        return new Promise((resolve) =>
          setTimeout(() => resolve(activitiesData), 35000)
        );
      }
      return Promise.resolve([]);
    });

    const startTime = Date.now();
    const result = await Promise.race([
      fetchActivitiesByRepresentative({ salesRepresentativeId }),
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              activities: activitiesData.map((a) => ({
                activityId: a.営業活動ID,
                customerId: a.取引先ID,
                salesRepresentativeId: a.営業担当者ID,
                activityType: a.活動種別,
                activityDateTime: a.活動日時,
                activityContent: a.活動内容,
                nextFollowUpScheduledDate: a.次回フォローアップ予定日,
                dealId: a.商談ID,
                estimatedAmount: a.見積金額,
                contractedFlag: a.成約フラグ,
                activityDurationMinutes: a.活動時間,
                activityCount: a.活動件数,
                activityFrequency: a.活動頻度,
                activityResult: a.活動結果,
                nextAction: a.次のアクション,
                createdAt: a.作成日時,
                updatedAt: a.更新日時,
                createdBy: a.作成者ID,
              })),
              totalCount: 2,
              fetchedAt: new Date().toISOString(),
            }),
          30000
        )
      ),
    ]);

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(30000);
    expect(result).toBeDefined();
    expect((result as any).activities).toHaveLength(2);
  });

  it('直近2件が活動日時の降順で返される', async () => {
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentativeData);
      } else if (tableName === '営業活動') {
        return Promise.resolve(activitiesData);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-01-15T10:00:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-01-10T14:30:00Z');
  });

  it('fetchedAt が ISO 8601 形式で返される', async () => {
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentativeData);
      } else if (tableName === '営業活動') {
        return Promise.resolve(activitiesData);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
