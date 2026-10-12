import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-821: fetchActivitiesByRepresentative - 複数件を活動日時の降順で返す', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定営業担当者が存在し、その営業担当者の営業活動が複数件ある場合、活動日時の降順で営業活動一覧・件数・取得時刻を返す', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockSalesReps = [
      {
        id: salesRepresentativeId,
        営業担当者ID: salesRepresentativeId,
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
      },
    ];

    const mockActivities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
        取引先ID: '770e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: salesRepresentativeId,
        活動種別: '電話',
        活動日時: '2024-01-20T15:30:00Z',
        活動内容: '顧客からの要件ヒアリング実施',
        createdAt: '2024-01-20T15:35:00Z',
        updatedAt: '2024-01-20T15:35:00Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440002',
        取引先ID: '770e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: salesRepresentativeId,
        活動種別: '訪問',
        活動日時: '2024-01-18T10:00:00Z',
        活動内容: '新規取引先への初期訪問',
        createdAt: '2024-01-18T10:30:00Z',
        updatedAt: '2024-01-18T10:30:00Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440003',
        取引先ID: '770e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: salesRepresentativeId,
        活動種別: 'メール',
        活動日時: '2024-01-15T09:15:00Z',
        活動内容: '提案資料の送付',
        createdAt: '2024-01-15T09:20:00Z',
        updatedAt: '2024-01-15T09:20:00Z',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440004',
        取引先ID: '770e8400-e29b-41d4-a716-446655440004',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440099',
        活動種別: '電話',
        活動日時: '2024-01-19T14:00:00Z',
        活動内容: '別営業担当者の活動',
        createdAt: '2024-01-19T14:05:00Z',
        updatedAt: '2024-01-19T14:05:00Z',
      },
    ];

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(mockSalesReps as any);
      }
      if (tableName === '営業活動') {
        return Promise.resolve(mockActivities as any);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.activities.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // 指定営業担当者のレコードのみが抽出され、活動日時の降順でソートされている
    expect(result.activities[0].activityDateTime).toBe('2024-01-20T15:30:00Z');
    expect(result.activities[0].activityContent).toBe('顧客からの要件ヒアリング実施');
    expect(result.activities[1].activityDateTime).toBe('2024-01-18T10:00:00Z');
    expect(result.activities[1].activityContent).toBe('新規取引先への初期訪問');
    expect(result.activities[2].activityDateTime).toBe('2024-01-15T09:15:00Z');
    expect(result.activities[2].activityContent).toBe('提案資料の送付');
  });
});
