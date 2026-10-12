import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1530: 目標商談金額が0以下のとき例外が発生する', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('見積金額が0のレコードを含めて返す', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業担当者',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440000',
        customerId: '770e8400-e29b-41d4-a716-446655440000',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2025-01-15T14:30:00Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: '2025-01-20T10:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440000',
        estimatedAmount: 0,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '週1回',
        activityResult: '対応者不在',
        nextAction: '翌週再度連絡',
        createdAt: '2025-01-15T14:30:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
    ];

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any)
      .mockResolvedValueOnce(activities as any);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].estimatedAmount).toBe(0);
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
