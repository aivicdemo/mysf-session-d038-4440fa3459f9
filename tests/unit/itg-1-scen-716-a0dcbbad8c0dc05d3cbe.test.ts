import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';
import type { SaveActivityInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-716: 指定された取引先IDが取引先テーブルに存在しない場合、CustomerNotFound エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('取引先が存在しない場合、CustomerNotFound エラーを発生させる', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：取引先は存在しない
    mockDataStore.listRecords
      .mockResolvedValueOnce([]); // 取引先テーブルに該当レコードなし

    const input: SaveActivityInput = {
      activityId: null,
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440001',
      activityType: '訪問',
      activityDateTime: '2026-10-07T10:30:00Z',
      activityContent: '顧客要件ヒアリング実施',
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
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    await expect(saveActivity(input)).rejects.toThrow();
  });
});
