import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-718: SalesRepresentativeNotFound エラー - 営業担当者が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された営業担当者IDが営業担当者テーブルに存在しない場合、SalesRepresentativeNotFoundエラーが発生する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先名: '株式会社サンプル',
            ステータス: '有効',
          },
        ]);
      }
      if (tableName === '営業担当者') {
        return Promise.resolve([]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '880e8400-e29b-41d4-a716-446655440002',
            活動タイプ名: '訪問',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: '990e8400-e29b-41d4-a716-446655440003',
            活動結果名: '成功',
            有効フラグ: true,
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: 'aa0e8400-e29b-41d4-a716-446655440004',
            活動頻度名: '初回',
            有効フラグ: true,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      activityId: null,
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '660e8400-e29b-41d4-a716-446655440099',
      activityType: '訪問',
      activityDateTime: '2025-01-15T10:30:00Z',
      activityContent: '顧客との初回打ち合わせを実施',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: '770e8400-e29b-41d4-a716-446655440001',
      operationTimestamp: '2025-01-15T10:35:00Z',
    };

    await expect(saveActivity(input)).rejects.toMatchObject({
      name: 'SalesRepresentativeNotFound',
      message: '指定された営業担当者が見つかりません。',
    });
  });
});
