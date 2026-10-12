import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1527: ダッシュボード表示値と実際の集計値の差異が金額で1万円以上のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動データの集計値を返す', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
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
        id: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '電話',
        activityDateTime: '2024-06-15T10:30:00Z',
        activityContent: '顧客A社へ提案電話',
        nextFollowUpScheduledDate: '2024-06-20T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440001',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '月1回',
        activityResult: '前向き',
        nextAction: '提案資料送付',
        createdAt: '2024-06-15T10:30:00Z',
        updatedAt: '2024-06-15T10:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-06-10T14:00:00Z',
        activityContent: '顧客B社訪問',
        nextFollowUpScheduledDate: '2024-06-25T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440002',
        estimatedAmount: 1200000,
        contractedFlag: true,
        activityDurationMinutes: 120,
        activityCount: 1,
        activityFrequency: '月2回',
        activityResult: '受注確定',
        nextAction: '契約手続き',
        createdAt: '2024-06-10T14:00:00Z',
        updatedAt: '2024-06-10T14:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        customerId: '770e8400-e29b-41d4-a716-446655440003',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: 'メール',
        activityDateTime: '2024-06-05T09:00:00Z',
        activityContent: '顧客C社へ見積提案メール',
        nextFollowUpScheduledDate: '2024-06-12T00:00:00Z',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        estimatedAmount: 800000,
        contractedFlag: false,
        activityDurationMinutes: 15,
        activityCount: 1,
        activityFrequency: '随時',
        activityResult: '返信待ち',
        nextAction: 'フォローアップ電話',
        createdAt: '2024-06-05T09:00:00Z',
        updatedAt: '2024-06-05T09:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
    ];

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any)
      .mockResolvedValueOnce(activities as any);

    const result = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toHaveLength(3);
    expect(result.activities[0].activityDateTime).toBe('2024-06-15T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-06-10T14:00:00Z');
    expect(result.activities[2].activityDateTime).toBe('2024-06-05T09:00:00Z');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
