import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-725: InvalidActivityResult エラー - 活動結果の有効フラグが無効な場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された活動結果がマスタに存在してもフラグが無効である場合、InvalidActivityResultエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            取引先名: 'テスト取引先',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            名前: 'テスト営業担当者',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            活動タイプ名: '訪問',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440020',
            活動頻度名: '初回',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440030',
            活動結果名: '成功',
            有効フラグ: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440031',
            活動結果名: '失敗',
            有効フラグ: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440032',
            活動結果名: '無効な結果コード',
            有効フラグ: false,
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
      activityContent: '顧客訪問による要件ヒアリング',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '無効な結果コード',
      nextAction: null,
      currentUserId: '550e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T10:00:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'InvalidActivityResult',
      message: '指定された活動結果は無効です。',
    });
  });
});
