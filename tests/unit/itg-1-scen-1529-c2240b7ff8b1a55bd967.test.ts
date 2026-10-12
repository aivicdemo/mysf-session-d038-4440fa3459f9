import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1529: 目標活動件数が0以下のとき例外が発生する', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動件数が0のレコードに対してエラーが発生する', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
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
        id: '770e8400-e29b-41d4-a716-446655440002',
        customerId: '880e8400-e29b-41d4-a716-446655440003',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-06-15T14:30:00Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: '2024-06-22T10:00:00Z',
        dealId: '990e8400-e29b-41d4-a716-446655440004',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 0,
        activityFrequency: 'weekly',
        activityResult: 'success',
        nextAction: '見積書送付',
        createdAt: '2024-06-15T14:35:00Z',
        updatedAt: '2024-06-15T14:35:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
    ];

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any)
      .mockResolvedValueOnce(activities as any);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow();
  });
});
