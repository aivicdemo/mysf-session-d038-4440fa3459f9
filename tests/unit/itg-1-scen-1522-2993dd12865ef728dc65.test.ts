import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1522: 最終更新時刻が現在時刻より未来のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動の更新日時が未来のとき例外が発生する', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        activityId: '650e8400-e29b-41d4-a716-446655440000',
        customerId: '750e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2025-02-20T14:30:00.000Z',
        activityContent: 'クライアントとの価格交渉',
        nextFollowUpScheduledDate: '2025-03-01T00:00:00.000Z',
        dealId: '850e8400-e29b-41d4-a716-446655440000',
        estimatedAmount: 500000,
        contractedFlag: false,
        createdAt: '2025-02-20T14:30:00.000Z',
        updatedAt: '2099-12-31T23:59:59.000Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '週1回',
        activityResult: '進行中',
        nextAction: '見積書を送付',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === 'SalesRepresentative') {
        return salesRepresentatives;
      }
      if (tableName === 'Activity') {
        return activities;
      }
      return [];
    });

    const input: FetchActivitiesByRepresentativeInput = { salesRepresentativeId };

    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow();
  });
});
