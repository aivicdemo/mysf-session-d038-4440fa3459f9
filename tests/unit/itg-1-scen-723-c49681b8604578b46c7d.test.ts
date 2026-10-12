import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-723: InvalidActivityType エラー - 活動種別の有効フラグが無効な場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された活動種別がマスタに存在してもフラグが無効である場合、InvalidActivityTypeエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: 'cust-001',
            取引先名: '株式会社ABC',
            ステータス: 'active',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: 'sales-rep-001',
            名前: '田中太郎',
            ステータス: 'active',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: 'activity-type-001',
            活動タイプ名: 'visit',
            有効フラグ: false,
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: 'activity-result-001',
            活動結果名: 'success',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: 'activity-frequency-001',
            活動頻度名: 'initial',
            有効フラグ: true,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      activityId: null,
      customerId: 'cust-001',
      salesRepresentativeId: 'sales-rep-001',
      activityType: 'visit',
      activityDateTime: '2026-10-07T10:00:00Z',
      activityContent: '顧客訪問による営業活動',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: 'initial',
      activityResult: 'success',
      nextAction: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'InvalidActivityType',
      message: '指定された活動種別は無効です。',
    });
  });
});
