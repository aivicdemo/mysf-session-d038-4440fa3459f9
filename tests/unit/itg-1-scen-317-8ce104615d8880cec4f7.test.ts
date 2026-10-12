import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { FetchAllCustomersOutput } from '../../src/logic/data-persistence';
import {
  deduplicateAndIdentifyCustomer,
  NoCustomerFound,
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

describe('SCEN-317: 検索キーに合致する顧客が存在しないときNoCustomerFoundエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoCustomerFound error when no customer matches the searchKey', async () => {
    const mockFn = dataPersistence.fetchAllCustomers as jest.Mock<
      (input: any) => Promise<FetchAllCustomersOutput>
    >;
    mockFn.mockResolvedValueOnce({
      customers: [
        {
          customerId: 'C001',
          customerName: '株式会社ABC',
          customerNameKana: null,
          customerCategory: null,
          postalCode: null,
          address: null,
          phoneNumber: '090-1111-1111',
          emailAddress: 'contact@abc.com',
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
        {
          customerId: 'C002',
          customerName: '株式会社XYZ',
          customerNameKana: null,
          customerCategory: null,
          postalCode: null,
          address: null,
          phoneNumber: '090-2222-2222',
          emailAddress: 'contact@xyz.com',
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
      totalCount: 2,
      fetchedAt: '2024-01-15T00:00:00Z',
    });

    const input: DeduplicateAndIdentifyCustomerInput = {
      searchKey: '999999',
      searchKeyType: 'customerId',
    };

    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      NoCustomerFound
    );
    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      '検索条件に合致する顧客が見つかりません。'
    );
  });
});
