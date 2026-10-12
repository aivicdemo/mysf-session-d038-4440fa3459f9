import { jest } from '@jest/globals';
import {
  saveActivity,
  InvalidActivityFrequency,
} from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-727: 指定された活動頻度がマスタに存在してもフラグが無効である場合、InvalidActivityFrequencyエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidActivityFrequency error when activity frequency exists but is marked invalid', async () => {
    const input = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
      activityType: '訪問',
      activityDateTime: '2026-01-15T10:30:00Z',
      activityContent: '営業活動テスト',
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
      operationTimestamp: '2026-01-15T10:35:00Z',
    };

    // Mock data store to return precondition data
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先名: 'テスト顧客',
            ステータス: '有効',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
            名前: 'テスト営業',
            ステータス: '有効',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
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
            id: '550e8400-e29b-41d4-a716-446655440011',
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
            id: '550e8400-e29b-41d4-a716-446655440012',
            活動頻度名: '初回',
            有効フラグ: false,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ]);
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
