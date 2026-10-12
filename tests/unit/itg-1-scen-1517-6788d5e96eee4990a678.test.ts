import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeInput, SaveActivityOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1517: 商談ステータスが未定義のときに警告が記録される', () => {
  const mockLogger = {
    warn: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).console = { warn: mockLogger.warn };
  });

  it('営業活動の見積金額が空のレコードについて警告が記録される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        name: '営業太郎',
        emailAddress: 'taro@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        activityId: '770e8400-e29b-41d4-a716-446655440002',
        customerId: '880e8400-e29b-41d4-a716-446655440003',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-06-15T10:30:00Z',
        activityContent: '顧客との初回接触',
        nextFollowUpScheduledDate: '2024-06-22T00:00:00Z',
        dealId: null,
        estimatedAmount: null,
        contractedFlag: false,
        createdAt: '2024-06-15T10:30:00Z',
        updatedAt: '2024-06-15T10:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '初回',
        activityResult: '未定',
        nextAction: '提案資料送付',
      },
      {
        activityId: 'aa0e8400-e29b-41d4-a716-446655440005',
        customerId: 'bb0e8400-e29b-41d4-a716-446655440006',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-06-10T14:00:00Z',
        activityContent: '提案ヒアリング',
        nextFollowUpScheduledDate: '2024-06-17T00:00:00Z',
        dealId: 'cc0e8400-e29b-41d4-a716-446655440007',
        estimatedAmount: 1000000,
        contractedFlag: false,
        createdAt: '2024-06-10T14:00:00Z',
        updatedAt: '2024-06-10T14:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '定期',
        activityResult: '成功',
        nextAction: '見積書発行',
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
    expect(result.activities[0].activityDateTime).toBe('2024-06-15T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-06-10T14:00:00Z');

    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
