import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-720: DealNotFound エラー - 商談が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動が商談に紐付く場合、指定された商談IDが商談テーブルに存在しないと、DealNotFoundエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先名: '株式会社テスト',
            ステータス: '有効',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
            名前: '営業 太郎',
            ステータス: '有効',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '商談') {
        return Promise.resolve([]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            活動タイプ名: '訪問',
            有効フラグ: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440020',
            活動結果名: '成功',
            有効フラグ: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440030',
            活動頻度名: '継続',
            有効フラグ: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      activityId: null,
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
      activityType: '訪問',
      activityDateTime: '2026-10-07T10:00:00Z',
      activityContent: '顧客訪問による商談確認',
      nextFollowUpScheduledDate: null,
      dealId: '550e8400-e29b-41d4-a716-446655440099',
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '継続',
      activityResult: '成功',
      nextAction: null,
      currentUserId: '550e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'DealNotFound',
      message: '指定された商談が見つかりません。',
    });
  });
});
