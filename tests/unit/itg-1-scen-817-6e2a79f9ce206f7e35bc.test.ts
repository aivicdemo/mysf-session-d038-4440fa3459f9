import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByCustomer, CustomerNotFound } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-817: fetchActivitiesByCustomer - 空レコード一覧を返す', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定取引先が存在し、営業活動レコードが1件もない場合、空のレコード一覧とtotalCount=0を返す', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomer = {
      id: customerId,
      name: 'テスト取引先A',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '取引先') {
        return Promise.resolve([mockCustomer as any]);
      }
      if (tableName === '営業活動') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByCustomer({ customerId });

    expect(result.activities).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
