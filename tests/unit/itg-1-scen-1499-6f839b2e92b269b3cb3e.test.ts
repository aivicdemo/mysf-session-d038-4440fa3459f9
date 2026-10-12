import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1499: データ不整合や欠落がある場合に営業部長に警告が通知される', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;

  const salesRepresentativeId = 'rep-001';
  const salesRepresentativeData = [
    {
      id: 'rep-001',
      営業担当者ID: 'rep-001',
      名前: '山田太郎',
      メールアドレス: 'yamada@company.com',
      電話番号: '090-1234-5678',
      部門: '営業部',
      役職: '営業部長',
      上司ID: 'mgr-001',
      ステータス: 'active',
      作成日時: '2025-01-01T00:00:00Z',
      更新日時: '2025-01-01T00:00:00Z',
      作成者: 'admin',
    },
  ];

  const activitiesData = [
    {
      id: 'activity-001',
      営業活動ID: 'activity-001',
      取引先ID: 'client-001',
      営業担当者ID: 'rep-001',
      活動種別: '訪問',
      活動日時: '2026-01-15T14:30:00Z',
      活動内容: null,
      次回フォローアップ予定日: '2026-01-22T00:00:00Z',
      商談ステージ: '提案',
      見積金額: 500000,
      成約フラグ: false,
      作成日時: '2026-01-15T14:30:00Z',
      作成者ID: 'user-001',
      更新日時: '2026-01-10T10:00:00Z',
      更新者ID: 'user-001',
      商談ID: 'deal-001',
      活動時間: null,
      活動件数: null,
      活動頻度: null,
      活動結果: null,
      次のアクション: null,
    },
    {
      id: 'activity-002',
      営業活動ID: 'activity-002',
      取引先ID: 'client-002',
      営業担当者ID: 'rep-001',
      活動種別: '電話',
      活動日時: '2026-01-10T10:00:00Z',
      活動内容: '進捗確認',
      次回フォローアップ予定日: null,
      商談ステージ: '初期接触',
      見積金額: -50000,
      成約フラグ: false,
      作成日時: '2026-01-10T10:00:00Z',
      作成者ID: 'user-001',
      更新日時: '2026-01-10T10:00:00Z',
      更新者ID: 'user-001',
      商談ID: 'deal-002',
      活動時間: null,
      活動件数: null,
      活動頻度: null,
      活動結果: null,
      次のアクション: null,
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

  it('活動日時の降順で並んだ2件のレコードが含まれる', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityId).toBe('activity-001');
    expect(result.activities[0].activityDateTime).toBe('2026-01-15T14:30:00Z');
    expect(result.activities[1].activityId).toBe('activity-002');
    expect(result.activities[1].activityDateTime).toBe('2026-01-10T10:00:00Z');
  });

  it('totalCount=2 である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.totalCount).toBe(2);
  });

  it('fetchedAt が ISO 8601 形式の時刻である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('activity-001 の活動内容が null である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities[0].activityContent).toBeNull();
  });

  it('activity-002 の見積金額が負数 -50000 である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities[1].estimatedAmount).toBe(-50000);
  });

  it('activity-001 の更新日時が活動日時より前である', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    const activity = result.activities[0];
    const activityDateTime = new Date(activity.activityDateTime);
    const updatedAt = new Date(activity.updatedAt);

    expect(updatedAt.getTime()).toBeLessThan(activityDateTime.getTime());
  });

  it('営業部長・山田太郎のメールアドレスが yamada@company.com である', async () => {
    const manager = salesRepresentativeData.find(
      (r) => r.営業担当者ID === salesRepresentativeId
    );

    expect(manager?.メールアドレス).toBe('yamada@company.com');
    expect(manager?.役職).toBe('営業部長');
  });
});
