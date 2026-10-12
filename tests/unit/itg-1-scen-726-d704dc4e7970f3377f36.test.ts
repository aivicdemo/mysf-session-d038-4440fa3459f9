import { jest } from '@jest/globals';
import {
  saveActivity,
  InvalidActivityFrequency,
} from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-726: 指定された活動頻度が活動頻度マスタに存在しない場合、InvalidActivityFrequencyエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidActivityFrequency error when activity frequency does not exist in master', async () => {
    const input = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
      activityType: '訪問',
      activityDateTime: '2025-01-15T14:30:00Z',
      activityContent: '新規提案ヒアリング実施',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: '550e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2025-01-15T15:00:00Z',
    };

    // Mock data store to return precondition data
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            取引先名: 'テスト顧客A',
            ステータス: 'active',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            名前: '営業太郎',
            ステータス: 'active',
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
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440020',
            活動結果名: '成功',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    try {
      await saveActivity(input);
      fail('Should have thrown InvalidActivityFrequency');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidActivityFrequency);
      expect((error as Error).message).toBe('指定された活動頻度は無効です。');
    }
  });
});
