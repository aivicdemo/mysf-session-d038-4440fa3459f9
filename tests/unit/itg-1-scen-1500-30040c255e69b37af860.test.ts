import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1500: ダッシュボード表示処理が遅延している場合にユーザーに遅延状況が通知される', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepresentativeData = [
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
      作成者: 'admin',
    },
  ];

  const activitiesData = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話',
      活動日時: '2024-12-01T10:30:00Z',
      活動内容: '顧客へのフォローアップ',
      次回フォローアップ予定日: '2024-12-08T00:00:00Z',
      商談ステージ: '提案段階',
      見積金額: 500000,
      成約フラグ: false,
      createdAt: '2024-12-01T10:30:00Z',
      updatedAt: '2024-12-01T10:30:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440001',
      活動時間: 30,
      活動件数: 1,
      活動頻度: '週1回',
      活動結果: '成功',
      次のアクション: '見積書を送付',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '訪問',
      活動日時: '2024-11-28T14:00:00Z',
      活動内容: '新規営業活動',
      次回フォローアップ予定日: '2024-12-05T00:00:00Z',
      商談ステージ: '初期接触',
      見積金額: 300000,
      成約フラグ: false,
      createdAt: '2024-11-28T14:00:00Z',
      updatedAt: '2024-11-28T14:00:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440002',
      活動時間: 60,
      活動件数: 1,
      活動頻度: '月1回',
      活動結果: '成功',
      次のアクション: '提案資料を準備',
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

  it('営業活動レコードが活動日時の降順で返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-12-01T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-11-28T14:00:00Z');
  });

  it('totalCount が 2 件と表示される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.totalCount).toBe(2);
  });

  it('最初の活動が営業活動ID 660e8400-e29b-41d4-a716-446655440001 である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities[0].activityId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.activities[0].activityContent).toBe('顧客へのフォローアップ');
  });

  it('次の活動が営業活動ID 660e8400-e29b-41d4-a716-446655440002 である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities[1].activityId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result.activities[1].activityContent).toBe('新規営業活動');
  });

  it('fetchedAt が返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.fetchedAt).toBeDefined();
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
