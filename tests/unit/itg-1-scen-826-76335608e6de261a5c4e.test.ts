import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchCustomerById, CustomerNotFound } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-826: fetchCustomerById - CustomerNotFound', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された取引先IDに対応するレコードが取引先テーブルに存在しない場合、CustomerNotFoundエラーが発生する', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '取引先') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(fetchCustomerById({ customerId })).rejects.toThrow(
      expect.objectContaining({
        message: `指定された取引先ID: ${customerId} は見つかりません。`,
      })
    );
  });
});
