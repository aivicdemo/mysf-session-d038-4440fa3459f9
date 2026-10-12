import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByCustomer, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-819: fetchActivitiesByCustomer - DataStoreError', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動テーブルの読み取りに失敗した場合、DataStoreErrorエラーが発生する', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomer = {
      customerId,
      customerName: 'テスト取引先A',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '取引先') {
        return Promise.resolve([mockCustomer as any]);
      }
      if (tableName === '営業活動') {
        return Promise.reject(new dataStore.DataStoreError('読み取りエラー'));
      }
      return Promise.resolve([]);
    });

    await expect(fetchActivitiesByCustomer({ customerId })).rejects.toThrow(
      expect.objectContaining({
        message: '営業活動データの取得に失敗しました。',
      })
    );
  });
});
