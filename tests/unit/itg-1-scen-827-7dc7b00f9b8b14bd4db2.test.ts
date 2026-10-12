import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchCustomerById, DataStoreError } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store.ts')>('../../src/platform/data-store.ts'),
  listRecords: jest.fn() as unknown as (tableName: string) => Promise<any[]>,
}));

describe('SCEN-827: fetchCustomerById DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError with specific message when data store access fails', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDataStore = require('../../src/platform/data-store.ts') as any;
    mockDataStore.listRecords.mockRejectedValueOnce(
      new DataStoreError('取引先データの取得に失敗しました。システム管理者に連絡してください。')
    );

    await expect(fetchCustomerById({ customerId })).rejects.toThrow(
      '取引先データの取得に失敗しました。システム管理者に連絡してください。'
    );
  });
});
