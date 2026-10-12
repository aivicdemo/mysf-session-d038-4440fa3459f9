import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1493: ダッシュボード表示内容（活動実績・商談進捗・目標達成度）が完全で正確であることが自動検証される', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;
  const mockCreateRecord = dataPersistence.createRecord as jest.Mock;

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepresentativeData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '山田太郎',
      メールアドレス: 'yamada.taro@example.com',
      電話番号: '090-1234-5678',
      部門: '営業部',
      役職: '営業課長',
      上司ID: '550e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      作成日時: '2024-01-01T09:00:00.000Z',
      更新日時: '2024-01-15T14:30:00.000Z',
      作成者: 'admin',
    },
  ];

  const activitiesData = [
    {
      id: '660e8400-e29b-41d4-a716-446655440100',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440100',
      取引先ID: '770e8400-e29b-41d4-a716-446655440100',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '訪問',
      活動日時: '2024-01-20T14:00:00.000Z',
      活動内容: '製品説明会を実施',
      次回フォローアップ予定日: '2024-01-27T10:00:00.000Z',
      商談ステージ: '提案中',
      見積金額: 500000,
      成約フラグ: false,
      作成日時: '2024-01-20T14:15:00.000Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2024-01-20T14:15:00.000Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440100',
      活動時間: 120,
      活動件数: 1,
      活動頻度: '週1回',
      活動結果: '好感触',
      次のアクション: '提案資料作成',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440101',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440101',
      取引先ID: '770e8400-e29b-41d4-a716-446655440101',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話',
      活動日時: '2024-01-18T10:30:00.000Z',
      活動内容: 'ニーズヒアリング',
      次回フォローアップ予定日: '2024-01-25T15:00:00.000Z',
      商談ステージ: 'ヒアリング',
      見積金額: 300000,
      成約フラグ: false,
      作成日時: '2024-01-18T10:45:00.000Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2024-01-18T10:45:00.000Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440101',
      活動時間: 45,
      活動件数: 1,
      活動頻度: '週2回',
      活動結果: '興味あり',
      次のアクション: '提案日程調整',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentativeData);
      } else if (tableName === '営業活動') {
        return Promise.resolve(activitiesData);
      }
      return Promise.resolve([]);
    });
  });

  it('営業活動レコード2件が活動日時の降順で返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-01-20T14:00:00.000Z');
    expect(result.activities[1].activityDateTime).toBe('2024-01-18T10:30:00.000Z');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('戻り値の activities にすべての必須フィールドが含まれる', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    const activity = result.activities[0];
    expect(activity).toHaveProperty('activityId');
    expect(activity).toHaveProperty('customerId');
    expect(activity).toHaveProperty('salesRepresentativeId');
    expect(activity).toHaveProperty('activityType');
    expect(activity).toHaveProperty('activityDateTime');
    expect(activity).toHaveProperty('activityContent');
    expect(activity).toHaveProperty('nextFollowUpScheduledDate');
    expect(activity).toHaveProperty('dealId');
    expect(activity).toHaveProperty('estimatedAmount');
    expect(activity).toHaveProperty('contractedFlag');
    expect(activity).toHaveProperty('activityDurationMinutes');
    expect(activity).toHaveProperty('activityCount');
    expect(activity).toHaveProperty('activityFrequency');
    expect(activity).toHaveProperty('activityResult');
    expect(activity).toHaveProperty('nextAction');
  });
});
