import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1523: 営業活動レコードを正常に取得して返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動レコードを正常に取得して返す', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業担当者',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        activityId: '660e8400-e29b-41d4-a716-446655440000',
        customerId: '770e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-01-15T10:30:00Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: '2024-01-20T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440000',
        estimatedAmount: 500000,
        contractedFlag: false,
        createdAt: '2024-01-15T10:35:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '月1回',
        activityResult: '提案書配布',
        nextAction: '見積確認',
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
    const result = await fetchActivitiesByRepresentative(input);

    expect(result.activities).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.activities[0].activityDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
