import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { FetchAllCustomersOutput } from '../../src/logic/data-persistence';
import {
  deduplicateAndIdentifyCustomer,
  MultipleExactMatches,
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

describe('SCEN-318: 検索キーに完全一致する顧客が複数存在するときMultipleExactMatchesエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MultipleExactMatches error when multiple customers match exactly', async () => {
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
          phoneNumber: '03-1234-5678',
          emailAddress: 'contact@abc.co.jp',
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
          customerId: 'C001',
          customerName: 'ABC株式会社',
          customerNameKana: null,
          customerCategory: null,
          postalCode: null,
          address: null,
          phoneNumber: '03-1234-5679',
          emailAddress: 'info@abc.co.jp',
          contactPersonName: null,
          paymentTerms: null,
          invoiceAddress: null,
          invoiceEmailAddress: null,
          status: null,
          createdAt: '2024-02-20T00:00:00Z',
          updatedAt: '2024-02-20T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T00:00:00Z',
    });

    const input: DeduplicateAndIdentifyCustomerInput = {
      searchKey: 'C001',
      searchKeyType: 'customerId',
    };

    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      MultipleExactMatches
    );
    await expect(deduplicateAndIdentifyCustomer(input)).rejects.toThrow(
      '複数の顧客が見つかりました。統合候補から正確な顧客を選択してください。'
    );
  });
});
