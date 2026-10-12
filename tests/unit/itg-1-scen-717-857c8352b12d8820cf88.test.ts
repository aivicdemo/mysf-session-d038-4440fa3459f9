import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-717: CustomerNotFound エラー - 取引先ステータスが無効な場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された取引先IDが存在してもステータスが無効である場合、CustomerNotFoundエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    // Mock data for different tables
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先名: 'テスト株式会社',
            ステータス: '無効',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-14T00:00:00Z',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            営業担当者ID: '660e8400-e29b-41d4-a716-446655440001',
            名前: '田中太郎',
            ステータス: '有効',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '880e8400-e29b-41d4-a716-446655440003',
            活動タイプID: '880e8400-e29b-41d4-a716-446655440003',
            活動タイプ名: '訪問',
            有効フラグ: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: '990e8400-e29b-41d4-a716-446655440004',
            活動結果ID: '990e8400-e29b-41d4-a716-446655440004',
            活動結果名: '成功',
            有効フラグ: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: 'aa0e8400-e29b-41d4-a716-446655440005',
            活動頻度ID: 'aa0e8400-e29b-41d4-a716-446655440005',
            活動頻度名: '初回',
            有効フラグ: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      activityId: null,
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '660e8400-e29b-41d4-a716-446655440001',
      activityType: '訪問',
      activityDateTime: '2025-01-15T10:00:00Z',
      activityContent: '新規営業訪問',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: '770e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2025-01-15T10:30:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'CustomerNotFound',
      message: '指定された取引先が見つかりません。',
    });
  });
});
