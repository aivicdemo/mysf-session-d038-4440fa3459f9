import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';
import type { SaveActivityInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-715: 更新時に営業活動IDが指定され、すべてが有効な場合、既存レコードが更新される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存営業活動レコードが更新され、更新日時が新しくなって返される', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：取引先、営業担当者、活動タイプ、結果、頻度、既存営業活動が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '660e8400-e29b-41d4-a716-446655440001',
        customerName: 'テスト商事株式会社',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([{
        id: '770e8400-e29b-41d4-a716-446655440002',
        salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
        name: '太郎',
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
        activityFrequencyName: '継続',
        enabled: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }])
      .mockResolvedValueOnce([{
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: '660e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
        activityType: '訪問',
        activityDateTime: '2026-01-10T10:00:00Z',
        activityContent: 'テスト',
        nextFollowUpScheduledDate: null,
        dealId: null,
        estimatedAmount: null,
        contractedFlag: false,
        activityDurationMinutes: 30,
        activityCount: 1,
        activityFrequency: '初回',
        activityResult: '成功',
        nextAction: null,
        createdAt: '2026-01-10T10:05:00Z',
        updatedAt: '2026-01-10T10:05:00Z',
        createdBy: '990e8400-e29b-41d4-a716-446655440004',
      }])
      .mockResolvedValueOnce({
        activityId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: '660e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
        activityType: '訪問',
        activityDateTime: '2026-01-15T14:30:00Z',
        activityContent: '既存顧客への定期訪問、新製品の提案実施',
        nextFollowUpScheduledDate: '2026-02-15',
        dealId: '880e8400-e29b-41d4-a716-446655440003',
        estimatedAmount: 500000,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '継続',
        activityResult: '成功',
        nextAction: '提案資料の送付、2月の商品デモ予約',
        createdAt: '2026-01-10T10:05:00Z',
        updatedAt: '2026-01-15T15:00:00Z',
        createdBy: '990e8400-e29b-41d4-a716-446655440004',
      }); // 更新後のレコード

    const input: SaveActivityInput = {
      activityId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      activityType: '訪問',
      activityDateTime: '2026-01-15T14:30:00Z',
      activityContent: '既存顧客への定期訪問、新製品の提案実施',
      nextFollowUpScheduledDate: '2026-02-15',
      dealId: '880e8400-e29b-41d4-a716-446655440003',
      estimatedAmount: 500000,
      contractedFlag: false,
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '継続',
      activityResult: '成功',
      nextAction: '提案資料の送付、2月の商品デモ予約',
      currentUserId: '990e8400-e29b-41d4-a716-446655440004',
      operationTimestamp: '2026-01-15T15:00:00Z',
    };

    const result = await saveActivity(input);

    expect(result.activityId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.createdAt).toBe('2026-01-10T10:05:00Z');
    expect(result.updatedAt).toBe('2026-01-15T15:00:00Z');
  });
});
