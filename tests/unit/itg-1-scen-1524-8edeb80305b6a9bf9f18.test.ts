import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1524: 指定営業担当者の営業活動レコード複数件を活動日時の降順で返す', () => {
  const mockLogger = {
    warn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).console = { warn: mockLogger.warn };
  });

  it('営業担当者の複数の営業活動レコードを活動日時の降順で返す', async () => {
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
        activityDateTime: '2024-12-15T10:30:00Z',
        activityContent: '新商品提案',
        nextFollowUpScheduledDate: '2024-12-22T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440000',
        estimatedAmount: 500000,
        contractedFlag: false,
        createdAt: '2024-12-15T10:30:00Z',
        updatedAt: '2024-12-15T10:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '定期',
        activityResult: '継続協議',
        nextAction: '見積提出',
      },
      {
        activityId: '661e8400-e29b-41d4-a716-446655440000',
        customerId: '771e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-12-14T14:00:00Z',
        activityContent: '進捗確認',
        nextFollowUpScheduledDate: '2024-12-21T00:00:00Z',
        dealId: '881e8400-e29b-41d4-a716-446655440000',
        estimatedAmount: 300000,
        contractedFlag: false,
        createdAt: '2024-12-14T14:00:00Z',
        updatedAt: '2024-12-14T14:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '不定期',
        activityResult: '情報収集',
        nextAction: '提案資料作成',
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

    expect(result.activities).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.activities[0].activityDateTime).toBe('2024-12-15T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-12-14T14:00:00Z');
  });
});
