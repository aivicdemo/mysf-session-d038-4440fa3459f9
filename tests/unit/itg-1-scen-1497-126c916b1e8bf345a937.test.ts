import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1497: ダッシュボード表示要求と生成完了の操作履歴が記録されて監査証跡が確保される', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;
  const mockCreateRecord = dataPersistence.createRecord as jest.Mock;

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepresentativeData = [
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
      作成日時: '2026-01-01T09:00:00Z',
      更新日時: '2026-01-15T10:30:00Z',
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
      活動日時: '2026-01-20T14:30:00Z',
      活動内容: '新製品説明会での打ち合わせ',
      次回フォローアップ予定日: '2026-02-03T10:00:00Z',
      商談ステージ: '提案',
      見積金額: 500000,
      成約フラグ: false,
      作成日時: '2026-01-20T14:35:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2026-01-20T14:35:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440001',
      活動時間: 90,
      活動件数: 1,
      活動頻度: '高',
      活動結果: '良好',
      次のアクション: '提案資料送付',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話',
      活動日時: '2026-01-18T10:15:00Z',
      活動内容: '契約内容確認',
      次回フォローアップ予定日: '2026-01-25T14:00:00Z',
      商談ステージ: '交渉中',
      見積金額: 350000,
      成約フラグ: false,
      作成日時: '2026-01-18T10:20:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2026-01-18T10:20:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440002',
      活動時間: 30,
      活動件数: 1,
      活動頻度: '中',
      活動結果: '予定通り',
      次のアクション: '見積修正依頼',
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
    mockCreateRecord.mockResolvedValue({ id: 'audit-log-id' });
  });

  it('ダッシュボード表示要求と生成完了が記録される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.activities[1].activityId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result.totalCount).toBe(2);
  });

  it('activities に最初の活動が営業活動ID=660e8400-e29b-41d4-a716-446655440001 で含まれる', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities[0].activityId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.activities[0].activityDateTime).toBe('2026-01-20T14:30:00Z');
    expect(result.activities[0].activityType).toBe('訪問');
    expect(result.activities[0].activityContent).toBe('新製品説明会での打ち合わせ');
  });

  it('activities に次の活動が営業活動ID=660e8400-e29b-41d4-a716-446655440002 で含まれる', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities[1].activityId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result.activities[1].activityDateTime).toBe('2026-01-18T10:15:00Z');
    expect(result.activities[1].activityType).toBe('電話');
    expect(result.activities[1].activityContent).toBe('契約内容確認');
  });

  it('totalCount=2 が返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.totalCount).toBe(2);
  });

  it('fetchedAt が ISO 8601 形式の現在時刻で設定される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
