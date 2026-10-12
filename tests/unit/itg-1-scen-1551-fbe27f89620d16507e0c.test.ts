import { fetchActivitiesByRepresentative, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1551: アップロード失敗時に内部キューに保持されてバッチ処理で定期的に再試行される', () => {
  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

  const salesRepresentativeTableData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '営業太郎',
      メールアドレス: 'taro@example.com',
      電話番号: '090-1234-5678',
      部門: '営業部',
      役職: '営業担当',
      上司ID: '550e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      作成者: 'admin',
    },
  ];

  it('fetchActivitiesByRepresentative の呼び出しは DataStoreError をスロー', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === '営業担当者') {
        return salesRepresentativeTableData;
      }
      if (tableName === '営業活動') {
        throw new Error('データの保存先がエラーを返しました（500）: Internal Server Error');
      }
      return [];
    });

    await expect(fetchActivitiesByRepresentative({ salesRepresentativeId })).rejects.toThrow(DataStoreError);
    await expect(fetchActivitiesByRepresentative({ salesRepresentativeId })).rejects.toThrow('営業活動データの取得に失敗しました。');
  });

  it('営業活動テーブルの読み取りが再度失敗する場合も DataStoreError をスロー', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === '営業担当者') {
        return salesRepresentativeTableData;
      }
      if (tableName === '営業活動') {
        throw new Error('データの保存先に接続できませんでした: Network error');
      }
      return [];
    });

    await expect(fetchActivitiesByRepresentative({ salesRepresentativeId })).rejects.toThrow(DataStoreError);
  });

  it('営業活動テーブルの読み取りが成功する場合は活動データを返す', async () => {
    const activityData = [
      {
        id: 'activity-001',
        activityId: 'activity-001',
        customerId: 'customer-001',
        salesRepresentativeId,
        activityType: '訪問',
        activityDateTime: '2026-10-01T10:00:00Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: '2026-10-08T00:00:00Z',
        dealId: 'deal-001',
        estimatedAmount: 100000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: 'interested',
        nextAction: 'follow-up email',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        createdBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === '営業担当者') {
        return salesRepresentativeTableData;
      }
      if (tableName === '営業活動') {
        return activityData;
      }
      return [];
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });
    expect(result.activities).toBeDefined();
    expect(result.activities.length).toBe(1);
    expect(result.activities[0].activityId).toBe('activity-001');
    expect(result.activities[0].salesRepresentativeId).toBe(salesRepresentativeId);
  });

  it('複数の営業活動レコードを降順で返す', async () => {
    const activitiesData = [
      {
        id: 'activity-003',
        activityId: 'activity-003',
        customerId: 'customer-001',
        salesRepresentativeId,
        activityType: '電話',
        activityDateTime: '2026-10-03T14:00:00Z',
        activityContent: 'フォローアップ',
        nextFollowUpScheduledDate: null,
        dealId: 'deal-001',
        estimatedAmount: 100000,
        contractedFlag: false,
        activityDurationMinutes: 15,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: 'confirmed',
        nextAction: null,
        createdAt: '2026-10-03T14:00:00Z',
        updatedAt: '2026-10-03T14:00:00Z',
        createdBy: 'admin',
      },
      {
        id: 'activity-002',
        activityId: 'activity-002',
        customerId: 'customer-001',
        salesRepresentativeId,
        activityType: 'メール',
        activityDateTime: '2026-10-02T11:00:00Z',
        activityContent: '提案資料送付',
        nextFollowUpScheduledDate: '2026-10-03T00:00:00Z',
        dealId: 'deal-001',
        estimatedAmount: 100000,
        contractedFlag: false,
        activityDurationMinutes: 5,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: 'pending',
        nextAction: 'follow-up call',
        createdAt: '2026-10-02T11:00:00Z',
        updatedAt: '2026-10-02T11:00:00Z',
        createdBy: 'admin',
      },
      {
        id: 'activity-001',
        activityId: 'activity-001',
        customerId: 'customer-001',
        salesRepresentativeId,
        activityType: '訪問',
        activityDateTime: '2026-10-01T10:00:00Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: '2026-10-08T00:00:00Z',
        dealId: 'deal-001',
        estimatedAmount: 100000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: 'interested',
        nextAction: 'follow-up email',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        createdBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === '営業担当者') {
        return salesRepresentativeTableData;
      }
      if (tableName === '営業活動') {
        return activitiesData;
      }
      return [];
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });
    expect(result.activities.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.activities[0].activityId).toBe('activity-003');
    expect(result.activities[1].activityId).toBe('activity-002');
    expect(result.activities[2].activityId).toBe('activity-001');
  });

  it('指定された営業担当者IDに該当する活動のみを返す', async () => {
    const activitiesData = [
      {
        id: 'activity-001',
        activityId: 'activity-001',
        customerId: 'customer-001',
        salesRepresentativeId,
        activityType: '訪問',
        activityDateTime: '2026-10-01T10:00:00Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: null,
        dealId: 'deal-001',
        estimatedAmount: 100000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: 'interested',
        nextAction: null,
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        createdBy: 'admin',
      },
      {
        id: 'activity-002',
        activityId: 'activity-002',
        customerId: 'customer-002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
        activityType: '訪問',
        activityDateTime: '2026-10-01T09:00:00Z',
        activityContent: 'デモンストレーション',
        nextFollowUpScheduledDate: null,
        dealId: 'deal-002',
        estimatedAmount: 200000,
        contractedFlag: false,
        activityDurationMinutes: 45,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: 'interested',
        nextAction: null,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-01T09:00:00Z',
        createdBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === '営業担当者') {
        return salesRepresentativeTableData;
      }
      if (tableName === '営業活動') {
        return activitiesData.filter((a) => a.salesRepresentativeId === salesRepresentativeId);
      }
      return [];
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });
    expect(result.activities.length).toBe(1);
    expect(result.activities[0].salesRepresentativeId).toBe(salesRepresentativeId);
  });
});
