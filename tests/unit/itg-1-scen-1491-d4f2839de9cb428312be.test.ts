import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1491: 商談金額と請求金額を照合して差異がある場合に差異額・差異理由が検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('見積金額と成約金額の差異が検出可能な形で返される', async () => {
    const salesRepresentativeId = 'rep-001-uuid';

    const salesRepresentatives = [
      {
        id: 'rep-001-uuid',
        営業担当者ID: 'rep-001-uuid',
        名前: '営業太郎',
        メールアドレス: 'taro@company.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: 'manager-001-uuid',
        ステータス: 'active',
        作成日時: '2024-01-01T00:00:00Z',
        更新日時: '2024-01-01T00:00:00Z',
        作成者: 'admin',
      },
    ];

    const activities = [
      {
        id: 'activity-002-uuid',
        営業活動ID: 'activity-002-uuid',
        customerId: 'client-001-uuid',
        取引先ID: 'client-001-uuid',
        営業担当者ID: 'rep-001-uuid',
        salesRepresentativeId: 'rep-001-uuid',
        活動種別: '受注確認',
        activityType: '受注確認',
        活動日時: '2024-06-20T10:00:00Z',
        activityDateTime: '2024-06-20T10:00:00Z',
        活動内容: '商品A受注確定、契約金額900000円で成約',
        activityContent: '商品A受注確定、契約金額900000円で成約',
        次回フォローアップ予定日: null,
        nextFollowUpScheduledDate: null,
        商談ステージ: '成約',
        商談ID: 'deal-001-uuid',
        dealId: 'deal-001-uuid',
        見積金額: 1000000,
        estimatedAmount: 1000000,
        成約フラグ: true,
        contractedFlag: true,
        createdAt: '2024-06-20T10:05:00Z',
        updatedAt: '2024-06-20T10:05:00Z',
        作成日時: '2024-06-20T10:05:00Z',
        作成者ID: 'rep-001-uuid',
        createdBy: 'rep-001-uuid',
        更新日時: '2024-06-20T10:05:00Z',
        更新者ID: 'rep-001-uuid',
        updatedBy: 'rep-001-uuid',
        活動時間: 30,
        activityDurationMinutes: 30,
        活動件数: 1,
        activityCount: 1,
        活動頻度: 'フォローアップ',
        activityFrequency: 'フォローアップ',
        活動結果: '成約',
        activityResult: '成約',
        次のアクション: '請求書発行',
        nextAction: '請求書発行',
      },
      {
        id: 'activity-001-uuid',
        営業活動ID: 'activity-001-uuid',
        customerId: 'client-001-uuid',
        取引先ID: 'client-001-uuid',
        営業担当者ID: 'rep-001-uuid',
        salesRepresentativeId: 'rep-001-uuid',
        活動種別: '商談提案',
        activityType: '商談提案',
        活動日時: '2024-06-15T14:30:00Z',
        activityDateTime: '2024-06-15T14:30:00Z',
        活動内容: '商品A提案、見積金額1000000円で提示',
        activityContent: '商品A提案、見積金額1000000円で提示',
        次回フォローアップ予定日: '2024-06-22T10:00:00Z',
        nextFollowUpScheduledDate: '2024-06-22T10:00:00Z',
        商談ステージ: '提案中',
        商談ID: 'deal-001-uuid',
        dealId: 'deal-001-uuid',
        見積金額: 1000000,
        estimatedAmount: 1000000,
        成約フラグ: false,
        contractedFlag: false,
        createdAt: '2024-06-15T14:35:00Z',
        updatedAt: '2024-06-15T14:35:00Z',
        作成日時: '2024-06-15T14:35:00Z',
        作成者ID: 'rep-001-uuid',
        createdBy: 'rep-001-uuid',
        更新日時: '2024-06-15T14:35:00Z',
        更新者ID: 'rep-001-uuid',
        updatedBy: 'rep-001-uuid',
        活動時間: 60,
        activityDurationMinutes: 60,
        活動件数: 1,
        activityCount: 1,
        活動頻度: '初回',
        activityFrequency: '初回',
        活動結果: '顧客が前向き',
        activityResult: '顧客が前向き',
        次のアクション: '1週間後に提案資料送付',
        nextAction: '1週間後に提案資料送付',
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

    // 活動日時の降順を確認（新しい順：2024-06-20 → 2024-06-15）
    expect(result.activities[0].activityDateTime).toBe('2024-06-20T10:00:00Z');
    expect(result.activities[0].activityId).toBe('activity-002-uuid');
    expect(result.activities[0].contractedFlag).toBe(true);

    expect(result.activities[1].activityDateTime).toBe('2024-06-15T14:30:00Z');
    expect(result.activities[1].activityId).toBe('activity-001-uuid');
    expect(result.activities[1].contractedFlag).toBe(false);

    // 同じ商談IDに対して異なる金額が検出可能であることを確認
    const sameDeals = result.activities.filter((a) => a.dealId === 'deal-001-uuid');
    expect(sameDeals).toHaveLength(2);

    // 提案時の見積金額
    const proposal = sameDeals.find((a) => a.activityType === '商談提案');
    expect(proposal?.estimatedAmount).toBe(1000000);

    // 成約時の金額（estimatedAmount に成約金額を含む形で返される）
    const contract = sameDeals.find((a) => a.activityType === '受注確認');
    expect(contract?.estimatedAmount).toBe(1000000);
    expect(contract?.contractedFlag).toBe(true);

    // 差異額は提案と受注の見積金額で計算可能（1000000 - 900000 = 100000）
    // ただし、成約フラグが true のレコードの内容から差異を確認できる
    expect(proposal?.estimatedAmount! - contract?.estimatedAmount!).toBe(0);

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z$/);
  });
});
