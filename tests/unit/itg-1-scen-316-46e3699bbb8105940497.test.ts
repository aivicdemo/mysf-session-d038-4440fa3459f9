import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { FetchAllCustomersOutput } from '../../src/logic/data-persistence';
import {
  deduplicateAndIdentifyCustomer,
  SearchKeyTypeInvalid,
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

describe('SCEN-316: 検索キーの種別がname・customerId・phoneNumber以外のときSearchKeyTypeInvalidエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SearchKeyTypeInvalid error when searchKeyType is invalid', async () => {
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
          phoneNumber: '090-1234-5678',
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
      searchKey: '12345',
      searchKeyType: 'invalid_type',
    } as unknown as DeduplicateAndIdentifyCustomerInput;

    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      SearchKeyTypeInvalid
    );
    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      '検索キーの種別が無効です。'
    );
  });
});
