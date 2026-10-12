import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1494: 営業部長に表示されるデータが自身の配下営業担当者のみに限定されて他部門データは非表示になる', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;

  const salesRepresentativeId = 'rep-001';
  const salesRepresentativeData = [
    {
      営業担当者ID: 'rep-001',
      名前: '営業部長A',
      メールアドレス: 'manager-a@company.com',
      電話番号: '09012345678',
      部門: '営業部',
      役職: '部長',
      上司ID: null,
      ステータス: 'active',
    },
    {
      営業担当者ID: 'rep-002',
      名前: '営業担当者B',
      メールアドレス: 'rep-b@company.com',
      電話番号: '09087654321',
      部門: '営業部',
      役職: '担当者',
      上司ID: 'rep-001',
      ステータス: 'active',
    },
    {
      営業担当者ID: 'rep-003',
      名前: '営業担当者C',
      メールアドレス: 'rep-c@company.com',
      電話番号: '09011223344',
      部門: '営業部',
      役職: '担当者',
      上司ID: 'rep-001',
      ステータス: 'active',
    },
    {
      営業担当者ID: 'rep-004',
      名前: '他部門営業D',
      メールアドレス: 'rep-d@company.com',
      電話番号: '09055667788',
      部門: '企画営業部',
      役職: '担当者',
      上司ID: 'manager-b',
      ステータス: 'active',
    },
  ];

  const activitiesData = [
    {
      営業活動ID: 'activity-101',
      取引先ID: 'client-001',
      営業担当者ID: 'rep-002',
      活動種別: '訪問',
      活動日時: '2025-01-15T10:00:00Z',
      活動内容: '既存商品の提案',
      次回フォローアップ予定日: '2025-01-20T00:00:00Z',
      商談ステージ: '提案',
      見積金額: 1500000,
      成約フラグ: false,
      作成日時: '2025-01-15T10:00:00Z',
      作成者ID: 'rep-002',
      更新日時: '2025-01-15T10:00:00Z',
      更新者ID: 'rep-002',
      商談ID: 'deal-001',
      活動時間: 60,
      活動件数: 1,
      活動頻度: '月1回',
      活動結果: '好意的',
      次のアクション: '提案資料作成',
    },
    {
      営業活動ID: 'activity-102',
      取引先ID: 'client-002',
      営業担当者ID: 'rep-003',
      活動種別: '電話',
      活動日時: '2025-01-14T14:30:00Z',
      活動内容: '契約内容の確認',
      次回フォローアップ予定日: '2025-01-21T00:00:00Z',
      商談ステージ: '契約',
      見積金額: 2000000,
      成約フラグ: true,
      作成日時: '2025-01-14T14:30:00Z',
      作成者ID: 'rep-003',
      更新日時: '2025-01-14T14:30:00Z',
      更新者ID: 'rep-003',
      商談ID: 'deal-002',
      活動時間: 30,
      活動件数: 1,
      活動頻度: '随時',
      活動結果: '成功',
      次のアクション: '契約書署名待ち',
    },
    {
      営業活動ID: 'activity-103',
      取引先ID: 'client-003',
      営業担当者ID: 'rep-004',
      活動種別: '訪問',
      活動日時: '2025-01-16T09:00:00Z',
      活動内容: '新製品説明会',
      次回フォローアップ予定日: '2025-01-25T00:00:00Z',
      商談ステージ: '初期接触',
      見積金額: 800000,
      成約フラグ: false,
      作成日時: '2025-01-16T09:00:00Z',
      作成者ID: 'rep-004',
      更新日時: '2025-01-16T09:00:00Z',
      更新者ID: 'rep-004',
      商談ID: 'deal-003',
      活動時間: 120,
      活動件数: 1,
      活動頻度: '四半期1回',
      活動結果: '興味あり',
      次のアクション: '提案予定',
    },
    {
      営業活動ID: 'activity-104',
      取引先ID: 'client-004',
      営業担当者ID: 'rep-002',
      活動種別: 'メール',
      活動日時: '2025-01-13T16:45:00Z',
      活動内容: '見積提示',
      次回フォローアップ予定日: '2025-01-18T00:00:00Z',
      商談ステージ: '提案',
      見積金額: 500000,
      成約フラグ: false,
      作成日時: '2025-01-13T16:45:00Z',
      作成者ID: 'rep-002',
      更新日時: '2025-01-13T16:45:00Z',
      更新者ID: 'rep-002',
      商談ID: 'deal-004',
      活動時間: 15,
      活動件数: 1,
      活動頻度: '随時',
      活動結果: '保留中',
      次のアクション: '返信待ち',
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

  it('配下営業担当者のデータのみが活動日時の降順で返される', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityId).toBe('activity-101');
    expect(result.activities[0].activityDateTime).toBe('2025-01-15T10:00:00Z');
    expect(result.activities[1].activityId).toBe('activity-102');
    expect(result.activities[1].activityDateTime).toBe('2025-01-14T14:30:00Z');
    expect(result.totalCount).toBe(2);
  });

  it('rep-004（他部門）と古い rep-002 の活動は含まれない', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    const activityIds = result.activities.map((a) => a.activityId);
    expect(activityIds).not.toContain('activity-103');
    expect(activityIds).not.toContain('activity-104');
  });

  it('totalCount が 2 を返す', async () => {
    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.totalCount).toBe(2);
  });
});
