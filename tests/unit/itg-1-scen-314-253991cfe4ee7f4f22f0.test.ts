import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { FetchAllCustomersOutput } from '../../src/logic/data-persistence';
import {
  deduplicateAndIdentifyCustomer,
  SearchKeyEmpty,
  type DeduplicateAndIdentifyCustomerInput,
} from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchAllCustomers: jest.fn<
    (input: any) => Promise<FetchAllCustomersOutput>
  >(),
}));

describe('SCEN-314: 検索キーが空文字列のときSearchKeyEmptyエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SearchKeyEmpty error when searchKey is empty string', async () => {
    const mockFn = dataPersistence.fetchAllCustomers as jest.Mock<
      (input: any) => Promise<FetchAllCustomersOutput>
    >;
    mockFn.mockResolvedValueOnce({
      customers: [],
      totalCount: 0,
      fetchedAt: '2024-01-15T00:00:00Z',
    });

    const input: DeduplicateAndIdentifyCustomerInput = {
      searchKey: '',
      searchKeyType: 'name',
    };

    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      SearchKeyEmpty
    );
    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      '検索キーを入力してください。'
    );
  });
});
