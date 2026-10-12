import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1525: ダッシュボード表示データが過去24時間以内に更新されていない場合に警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('最新の営業活動が現在時刻から24時間以上前である場合、警告ログが記録される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '田中太郎',
        emailAddress: 'tanaka@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-12-20T08:00:00.000Z',
        activityContent: '商品説明',
        nextFollowUpScheduledDate: '2024-12-27T00:00:00.000Z',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: 'weekly',
        activityResult: '未決定',
        nextAction: '見積提示待ち',
        createdAt: '2024-12-20T08:00:00.000Z',
        updatedAt: '2024-12-20T08:00:00.000Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-12-18T10:30:00.000Z',
        activityContent: '契約内容説明',
        nextFollowUpScheduledDate: '2024-12-25T00:00:00.000Z',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        estimatedAmount: 300000,
        contractedFlag: true,
        activityDurationMinutes: 60,
        activityCount: 3,
        activityFrequency: 'daily',
        activityResult: '成約',
        nextAction: '請求書作成',
        createdAt: '2024-12-18T10:30:00.000Z',
        updatedAt: '2024-12-18T10:30:00.000Z',
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
    expect(result.activities[0].activityDateTime).toBe('2024-12-20T08:00:00.000Z');
    expect(result.activities[1].activityDateTime).toBe('2024-12-18T10:30:00.000Z');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
