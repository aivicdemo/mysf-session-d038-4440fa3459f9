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

describe('SCEN-315: 検索キーがnullのときSearchKeyEmptyエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SearchKeyEmpty error when searchKey is null', async () => {
    const mockFn = dataPersistence.fetchAllCustomers as jest.Mock<
      (input: any) => Promise<FetchAllCustomersOutput>
    >;
    mockFn.mockResolvedValueOnce({
      customers: [
        {
          customerId: 'CUST001',
          customerName: '山田太郎',
          customerNameKana: null,
          customerCategory: null,
          postalCode: null,
          address: null,
          phoneNumber: '09012345678',
          emailAddress: 'yamada@example.com',
          contactPersonName: null,
          paymentTerms: null,
          invoiceAddress: null,
          invoiceEmailAddress: null,
          status: null,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T00:00:00Z',
    });

    const input = {
      searchKey: null,
      searchKeyType: 'name',
    } as unknown as DeduplicateAndIdentifyCustomerInput;

    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      SearchKeyEmpty
    );
    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      '検索キーを入力してください。'
    );
  });
});
