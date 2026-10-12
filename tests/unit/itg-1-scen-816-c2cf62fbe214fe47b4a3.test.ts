import { fetchActivitiesByCustomer } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-816: 複数件の営業活動が活動日時の降順で取得される', () => {
  const customerId = '550e8400-e29b-41d4-a716-446655440000';
  const activities = [
    {
      activityId: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '660e8400-e29b-41d4-a716-446655440001',
      activityType: '電話',
      activityDateTime: '2025-01-15T14:30:00Z',
      activityContent: '新商品説明',
      nextFollowUpScheduledDate: '2025-01-22T10:00:00Z',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: '週1回',
      activityResult: '関心あり',
      nextAction: '提案資料送付',
      createdAt: '2025-01-15T14:30:00Z',
      updatedAt: '2025-01-15T14:30:00Z',
      createdBy: '660e8400-e29b-41d4-a716-446655440001',
    },
    {
      activityId: 'b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '660e8400-e29b-41d4-a716-446655440001',
      activityType: '訪問',
      activityDateTime: '2025-01-20T10:00:00Z',
      activityContent: '契約条件協議',
      nextFollowUpScheduledDate: '2025-01-27T15:00:00Z',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      estimatedAmount: 550000,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 2,
      activityFrequency: '週1回',
      activityResult: '前向き',
      nextAction: '見積書作成',
      createdAt: '2025-01-20T10:00:00Z',
      updatedAt: '2025-01-20T10:00:00Z',
      createdBy: '660e8400-e29b-41d4-a716-446655440001',
    },
    {
      activityId: 'c3d4e5f6-g7h8-49i0-j1k2-l3m4n5o6p7q8',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '660e8400-e29b-41d4-a716-446655440001',
      activityType: 'メール',
      activityDateTime: '2025-01-10T09:15:00Z',
      activityContent: '初回提案資料送付',
      nextFollowUpScheduledDate: '2025-01-17T10:00:00Z',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      estimatedAmount: 450000,
      contractedFlag: false,
      activityDurationMinutes: 15,
      activityCount: 1,
      activityFrequency: '随時',
      activityResult: '送付完了',
      nextAction: '開封確認待ち',
      createdAt: '2025-01-10T09:15:00Z',
      updatedAt: '2025-01-10T09:15:00Z',
      createdBy: '660e8400-e29b-41d4-a716-446655440001',
    },
  ];
  const customerData = {
    customerId: '550e8400-e29b-41d4-a716-446655440000',
    customerName: 'テスト取引先A',
    customerNameKana: null,
    customerCategory: null,
    postalCode: null,
    address: null,
    phoneNumber: null,
    emailAddress: null,
    contactPersonName: null,
    paymentTerms: null,
    invoiceAddress: null,
    invoiceEmailAddress: null,
    status: null,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    createdBy: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return activities sorted by activity date time in descending order', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === 'customers') {
        return Promise.resolve([customerData]);
      }
      if (tableName === 'activities') {
        return Promise.resolve(activities);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByCustomer({ customerId });

    expect(result.activities).toHaveLength(3);
    expect(result.activities[0].activityDateTime).toBe('2025-01-20T10:00:00Z');
    expect(result.activities[1].activityDateTime).toBe('2025-01-15T14:30:00Z');
    expect(result.activities[2].activityDateTime).toBe('2025-01-10T09:15:00Z');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
