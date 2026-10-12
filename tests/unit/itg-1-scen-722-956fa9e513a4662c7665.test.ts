import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-722: InvalidActivityType エラー - 活動種別が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された活動種別が活動タイプマスタに存在しない場合、InvalidActivityTypeエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: 'cust-uuid-001',
            取引先名: '顧客A',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: 'sales-uuid-001',
            名前: '営業太郎',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: 'result-uuid-001',
            活動結果名: '成功',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: 'freq-uuid-001',
            活動頻度名: '初回',
            有効フラグ: true,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      activityId: null,
      customerId: 'cust-uuid-001',
      salesRepresentativeId: 'sales-uuid-001',
      activityType: '無効な活動種別',
      activityDateTime: '2026-10-07T10:00:00Z',
      activityContent: 'テスト活動の詳細',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2026-10-07T10:00:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'InvalidActivityType',
      message: '指定された活動種別は無効です。',
    });
  });
});
