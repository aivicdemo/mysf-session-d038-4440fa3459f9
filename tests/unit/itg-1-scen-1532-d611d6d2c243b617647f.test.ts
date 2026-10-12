import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1532: 商談ステージ別データが不完全な場合に部分的なデータで計算が続行される', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('不完全なデータを含むレコードについて、計算が続行される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '田中太郎',
        emailAddress: 'tanaka@example.com',
        phoneNumber: '09012345678',
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
        activityDateTime: '2024-11-20T10:30:00Z',
        activityContent: '新商品の説明',
        nextFollowUpScheduledDate: '2024-11-27T10:30:00Z',
        dealId: '990e8400-e29b-41d4-a716-446655440004',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '月1回',
        activityResult: '継続検討',
        nextAction: '提案資料を送付',
        createdAt: '2024-11-20T10:35:00Z',
        updatedAt: '2024-11-20T10:35:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440005',
        customerId: 'bb0e8400-e29b-41d4-a716-446655440006',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: '訪問',
        activityDateTime: '2024-11-19T14:00:00Z',
        activityContent: null,
        nextFollowUpScheduledDate: null,
        dealId: null,
        estimatedAmount: null,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: null,
        activityResult: null,
        nextAction: null,
        createdAt: '2024-11-19T14:05:00Z',
        updatedAt: '2024-11-19T14:05:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440007',
        customerId: 'dd0e8400-e29b-41d4-a716-446655440008',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        activityType: 'メール',
        activityDateTime: '2024-11-18T09:00:00Z',
        activityContent: '見積書送付',
        nextFollowUpScheduledDate: '2024-11-25T09:00:00Z',
        dealId: 'ee0e8400-e29b-41d4-a716-446655440009',
        estimatedAmount: 1200000,
        contractedFlag: false,
        activityDurationMinutes: 15,
        activityCount: 1,
        activityFrequency: '週1回',
        activityResult: '送付完了',
        nextAction: '回答待ち',
        createdAt: '2024-11-18T09:10:00Z',
        updatedAt: '2024-11-18T09:10:00Z',
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
    expect(result.activities[0].activityDateTime).toBe('2024-11-20T10:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2024-11-19T14:00:00Z');
    expect(result.activities[1].activityContent).toBeNull();
    expect(result.activities[2].activityDateTime).toBe('2024-11-18T09:00:00Z');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
