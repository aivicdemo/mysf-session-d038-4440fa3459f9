import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type {
  FetchAllCustomersOutput,
  SaveCustomerOutput,
} from '../../src/logic/data-persistence';
import {
  deduplicateAndIdentifyCustomer,
  SearchKeyEmpty,
  SearchKeyTypeInvalid,
  NoCustomerFound,
  MultipleExactMatches,
  type DeduplicateAndIdentifyCustomerInput,
  type DeduplicateAndIdentifyCustomerOutput,
  type Customer,
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

describe('SCEN-311: 顧客IDで検索して顧客が特定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should identify a customer by customerId', async () => {
    const mockCustomers: FetchAllCustomersOutput['customers'] = [
      {
        customerId: 'CUST-001',
        customerName: '株式会社A',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: '03-1234-5678',
        emailAddress: 'contact@company-a.com',
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
        customerId: 'CUST-002',
        customerName: '株式会社B',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: '03-9876-5432',
        emailAddress: 'contact@company-b.com',
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
      {
        customerId: 'CUST-003',
        customerName: '株式会社C',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: '03-5555-6666',
        emailAddress: 'contact@company-c.com',
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2024-03-10T00:00:00Z',
        updatedAt: '2024-03-10T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    const mockFn = dataPersistence.fetchAllCustomers as jest.Mock<
      (input: any) => Promise<FetchAllCustomersOutput>
    >;
    mockFn.mockResolvedValueOnce({
      customers: mockCustomers,
      totalCount: 3,
      fetchedAt: '2024-01-15T00:00:00Z',
    });

    const input: DeduplicateAndIdentifyCustomerInput = {
      searchKey: 'CUST-001',
      searchKeyType: 'customerId',
    };

    const result = await deduplicateAndIdentifyCustomer(input);

    expect(result.status).toBe('identified');
    expect(result.identifiedCustomer?.customerId).toBe('CUST-001');
    expect(result.identifiedCustomer?.customerName).toBe('株式会社A');
    expect(result.identifiedCustomer?.phoneNumber).toBe('03-1234-5678');
    expect(result.identifiedCustomer?.emailAddress).toBe('contact@company-a.com');
    expect(result.deduplicationCandidates).toEqual([]);
  });
});
