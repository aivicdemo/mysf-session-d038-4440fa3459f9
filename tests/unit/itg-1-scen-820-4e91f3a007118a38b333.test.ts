import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByCustomer } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-820: fetchActivitiesByCustomer - fetchedAt と活動日時の降順', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('レコード取得時、fetchedAtにISO 8601形式の現在日時が設定され、activitiesが活動日時の降順でソートされている', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomer = {
      id: customerId,
      name: 'テスト取引先A',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const mockActivities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
        取引先ID: customerId,
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440001',
        活動種別: '電話',
        活動日時: '2026-01-15T10:30:00.000Z',
        活動内容: '顧客との初期ヒアリング',
        createdAt: '2026-01-15T10:30:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
        取引先ID: customerId,
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440001',
        活動種別: '訪問',
        活動日時: '2026-01-10T14:00:00.000Z',
        活動内容: '取引先訪問・提案説明',
        createdAt: '2026-01-10T14:00:00.000Z',
        updatedAt: '2026-01-10T14:00:00.000Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440003',
        取引先ID: customerId,
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440001',
        活動種別: 'メール',
        活動日時: '2026-01-05T09:15:00.000Z',
        活動内容: '初期接触メール送信',
        createdAt: '2026-01-05T09:15:00.000Z',
        updatedAt: '2026-01-05T09:15:00.000Z',
      },
    ];

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '取引先') {
        return Promise.resolve([mockCustomer as any]);
      }
      if (tableName === '営業活動') {
        return Promise.resolve(mockActivities as any);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByCustomer({ customerId });

    expect(result.activities.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // 活動日時の降順を確認
    expect(result.activities[0].activityDateTime).toBe('2026-01-15T10:30:00.000Z');
    expect(result.activities[1].activityDateTime).toBe('2026-01-10T14:00:00.000Z');
    expect(result.activities[2].activityDateTime).toBe('2026-01-05T09:15:00.000Z');
  });
});
