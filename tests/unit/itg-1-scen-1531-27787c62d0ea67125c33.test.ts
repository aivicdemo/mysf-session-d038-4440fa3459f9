import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1531: 営業活動実績データが当月分で存在しない場合に警告が記録される', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('当月分の営業活動実績が存在しない場合、警告ログが記録される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '09012345678',
        department: '営業部',
        jobTitle: '営業担当者',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-11-15T10:30:00Z',
        activityContent: '顧客確認電話',
        nextFollowUpScheduledDate: '2024-11-22T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 15,
        activityCount: 1,
        activityFrequency: '定期',
        activityResult: '成功',
        nextAction: '提案資料送付',
        createdAt: '2024-11-15T10:30:00Z',
        updatedAt: '2024-11-15T10:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-10-01T14:00:00Z',
        activityContent: '初回訪問',
        nextFollowUpScheduledDate: '2024-10-15T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        estimatedAmount: 300000,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '不定期',
        activityResult: '成功',
        nextAction: '見積作成',
        createdAt: '2024-10-01T14:00:00Z',
        updatedAt: '2024-10-01T14:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
    ];

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any)
      .mockResolvedValueOnce(activities as any);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityDateTime).toBe('2024-11-15T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-10-01T14:00:00Z');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
