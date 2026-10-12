import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1498: データ鮮度不足の場合に営業部長に警告が通知される', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepresentativeData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '山田太郎',
      メールアドレス: 'yamada@company.com',
      電話番号: '090-1234-5678',
      部門: '営業部',
      役職: '営業部長',
      上司ID: '550e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      作成日時: '2024-01-01T00:00:00Z',
      更新日時: '2024-01-01T00:00:00Z',
      作成者: 'admin',
    },
  ];

  const activitiesData = [
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440000',
      取引先ID: '770e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話',
      活動日時: '2023-10-05T10:00:00Z',
      活動内容: '製品説明',
      次回フォローアップ予定日: '2023-10-12T00:00:00Z',
      商談ステージ: '提案',
      見積金額: 500000,
      成約フラグ: false,
      作成日時: '2023-10-05T10:00:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2023-10-05T10:00:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440000',
      活動時間: 30,
      活動件数: 1,
      活動頻度: '月1回',
      活動結果: '興味あり',
      次のアクション: '見積書送付',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '訪問',
      活動日時: '2023-09-20T14:30:00Z',
      活動内容: '年末挨拶',
      次回フォローアップ予定日: '2024-02-01T00:00:00Z',
      商談ステージ: '初期接触',
      見積金額: 0,
      成約フラグ: false,
      作成日時: '2023-09-20T14:30:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2023-09-20T14:30:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440001',
      活動時間: 45,
      活動件数: 1,
      活動頻度: '年1回',
      活動結果: '良好',
      次のアクション: '新年営業',
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

  it('活動日時の降順でソート済みの2件のレコードが返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2023-10-05T10:00:00Z');
    expect(result.activities[1].activityDateTime).toBe('2023-09-20T14:30:00Z');
    expect(result.totalCount).toBe(2);
  });

  it('totalCount=2 が返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.totalCount).toBe(2);
  });

  it('fetchedAt が ISO 8601 形式で返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('営業部長のメールアドレスが yamada@company.com である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    const manager = salesRepresentativeData.find(
      (r) => r.営業担当者ID === salesRepresentativeId
    );
    expect(manager?.メールアドレス).toBe('yamada@company.com');
    expect(manager?.役職).toBe('営業部長');
  });

  it('データが 30 日以上前である（鮮度不足）', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    const latestActivityDateTime = new Date(result.activities[0].activityDateTime);
    const fetchedAtTime = new Date(result.fetchedAt);
    const daysDiff = (fetchedAtTime.getTime() - latestActivityDateTime.getTime()) / (1000 * 60 * 60 * 24);

    expect(daysDiff).toBeGreaterThan(30);
  });
});
