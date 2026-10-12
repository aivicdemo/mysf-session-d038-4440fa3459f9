import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1528: 商談ステータスがダッシュボードと営業活動データで矛盾しているとき例外が発生する', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動を活動日時の降順で返す', async () => {
    const salesRepresentativeId = 'rep-uuid-001';

    const salesRepresentatives = [
      {
        id: 'rep-uuid-001',
        name: '営業担当者A',
        emailAddress: 'rep-a@company.com',
        phoneNumber: '090-xxxx-xxxx',
        department: '営業部',
        jobTitle: '営業',
        supervisorId: 'manager-uuid-001',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        activityId: 'activity-uuid-001',
        customerId: 'client-uuid-001',
        salesRepresentativeId: 'rep-uuid-001',
        activityType: '訪問',
        activityDateTime: '2026-01-15T10:00:00Z',
        activityContent: '製品説明',
        nextFollowUpScheduledDate: '2026-01-22T00:00:00Z',
        dealId: 'deal-uuid-001',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: '前向き',
        nextAction: '見積書送付',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:00:00Z',
        createdBy: 'rep-uuid-001',
      },
      {
        activityId: 'activity-uuid-002',
        customerId: 'client-uuid-001',
        salesRepresentativeId: 'rep-uuid-001',
        activityType: '電話',
        activityDateTime: '2026-01-20T14:30:00Z',
        activityContent: '進捗確認',
        nextFollowUpScheduledDate: '2026-01-27T00:00:00Z',
        dealId: 'deal-uuid-001',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: '前向き',
        nextAction: '条件調整',
        createdAt: '2026-01-20T14:30:00Z',
        updatedAt: '2026-01-20T14:30:00Z',
        createdBy: 'rep-uuid-001',
      },
    ];

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any)
      .mockResolvedValueOnce(activities as any);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].activityId).toBe('activity-uuid-002');
    expect(result.activities[0].activityDateTime).toBe('2026-01-20T14:30:00Z');
    expect(result.activities[1].activityId).toBe('activity-uuid-001');
    expect(result.activities[1].activityDateTime).toBe('2026-01-15T10:00:00Z');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
