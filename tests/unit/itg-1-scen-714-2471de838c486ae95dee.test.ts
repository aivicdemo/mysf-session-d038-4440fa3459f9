import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';
import type { SaveActivityInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-714: 新規作成時に必須項目がすべて入力され、取引先・営業担当者・マスタ値がすべて有効な場合、レコードが保存されIDと作成日時を含む結果が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規営業活動レコードが正常に保存され返される', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：取引先、営業担当者、活動タイプ、結果、頻度が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: 'cust-001-uuid',
        customerId: 'cust-001-uuid',
        customerName: 'テスト商事株式会社',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([{
        id: 'rep-001-uuid',
        salesRepresentativeId: 'rep-001-uuid',
        name: '山田太郎',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([{
        id: 'acttype-001-uuid',
        activityTypeName: '訪問',
        enabled: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([{
        id: 'actresult-001-uuid',
        activityResultName: '成功',
        enabled: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([{
        id: 'actfreq-001-uuid',
        activityFrequencyName: '初回',
        enabled: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([]) // 営業活動テーブルは空
      .mockResolvedValueOnce({
        activityId: 'activity-system-uuid-001',
        customerId: 'cust-001-uuid',
        salesRepresentativeId: 'rep-001-uuid',
        activityType: '訪問',
        activityDateTime: '2026-10-15T10:30:00Z',
        activityContent: '新規顧客訪問・ニーズヒアリング実施',
        nextFollowUpScheduledDate: null,
        dealId: null,
        estimatedAmount: null,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '初回',
        activityResult: '成功',
        nextAction: null,
        createdAt: '2026-10-15T10:30:00Z',
        updatedAt: '2026-10-15T10:30:00Z',
        createdBy: 'user-001-uuid',
      }); // 保存後のレコード

    const input: SaveActivityInput = {
      activityId: null,
      customerId: 'cust-001-uuid',
      salesRepresentativeId: 'rep-001-uuid',
      activityType: '訪問',
      activityDateTime: '2026-10-15T10:30:00Z',
      activityContent: '新規顧客訪問・ニーズヒアリング実施',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: 'user-001-uuid',
      operationTimestamp: '2026-10-15T10:30:00Z',
    };

    const result = await saveActivity(input);

    expect(result).toBeDefined();
    expect(result.activityId).not.toBeNull();
    expect(result.customerId).toBe('cust-001-uuid');
    expect(result.createdBy).toBe('user-001-uuid');
    expect(result.createdAt).toBeDefined();
  });
});
