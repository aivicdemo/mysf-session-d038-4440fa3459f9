import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveActivity } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

import { listRecords, createRecord } from '../../src/platform/data-store';

describe('SCEN-721: 正常系 - 商談IDが指定されない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談IDが指定されない場合、商談の存在確認がスキップされ、他の検証が成功すれば保存が完了する', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;
    const mockCreateRecord = createRecord as jest.MockedFunction<typeof createRecord>;

    const activityId = '550e8400-e29b-41d4-a716-446655440100';

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '取引先') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            取引先ID: '550e8400-e29b-41d4-a716-446655440001',
            取引先名: 'テスト取引先A',
            ステータス: '有効',
            作成日時: '2024-01-01T00:00:00Z',
            更新日時: '2024-01-01T00:00:00Z',
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
            作成日時: '2024-01-01T00:00:00Z',
            更新日時: '2024-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動タイプマスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440101',
            活動タイプ名: '訪問',
            有効フラグ: true,
            作成日時: '2024-01-01T00:00:00Z',
            更新日時: '2024-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動結果マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440201',
            活動結果名: '成功',
            有効フラグ: true,
            作成日時: '2024-01-01T00:00:00Z',
            更新日時: '2024-01-01T00:00:00Z',
          },
        ]);
      }
      if (tableName === '活動頻度マスタ') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440301',
            活動頻度名: '初回',
            有効フラグ: true,
            作成日時: '2024-01-01T00:00:00Z',
            更新日時: '2024-01-01T00:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    mockCreateRecord.mockResolvedValue({
      id: activityId,
      activityId,
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:30:00Z',
      activityContent: '新規営業活動の登録テスト',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440003',
    });

    const input = {
      activityId: null,
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:30:00Z',
      activityContent: '新規営業活動の登録テスト',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2024-01-15T10:30:00Z',
    };

    const result = await saveActivity(input);

    expect(result).toMatchObject({
      activityId: expect.any(String),
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      activityType: '訪問',
      activityDateTime: '2024-01-15T10:30:00Z',
      activityContent: '新規営業活動の登録テスト',
      nextFollowUpScheduledDate: null,
      dealId: null,
      estimatedAmount: null,
      contractedFlag: false,
      activityDurationMinutes: 30,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      nextAction: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      createdBy: '550e8400-e29b-41d4-a716-446655440003',
    });

    expect(mockCreateRecord).toHaveBeenCalledWith(
      '営業活動',
      expect.objectContaining({
        customerId: '550e8400-e29b-41d4-a716-446655440001',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      })
    );
  });
});
