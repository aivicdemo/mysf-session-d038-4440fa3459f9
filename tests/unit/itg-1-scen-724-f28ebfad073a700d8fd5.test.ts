import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-724: InvalidActivityResult エラー - 活動結果が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された活動結果が活動結果マスタに存在しない場合、InvalidActivityResultエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            取引先ID: '550e8400-e29b-41d4-a716-446655440001',
            取引先名: 'テスト株式会社',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
            名前: '営業太郎',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            活動タイプ名: '訪問',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440005',
            活動頻度名: '初回',
            有効フラグ: true,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      activityId: null,
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:00:00Z',
      activityContent: '顧客訪問で製品説明を実施',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '無効な活動結果コード',
      nextAction: null,
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'InvalidActivityResult',
      message: '指定された活動結果は無効です。',
    });
  });
});
