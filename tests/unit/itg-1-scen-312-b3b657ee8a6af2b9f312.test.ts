import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { FetchAllCustomersOutput } from '../../src/logic/data-persistence';
import {
  deduplicateAndIdentifyCustomer,
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

describe('SCEN-312: 顧客名で検索して顧客が特定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should identify a customer by name', async () => {
    const mockCustomers: FetchAllCustomersOutput['customers'] = [
      {
        customerId: 'CUST001',
        customerName: '山田太郎',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: '09012345678',
        emailAddress: 'yamada.taro@example.com',
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
        customerId: 'CUST002',
        customerName: '鈴木花子',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: '09087654321',
        emailAddress: 'suzuki.hanako@example.com',
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
        customerId: 'CUST003',
        customerName: '佐藤次郎',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: '09011223344',
        emailAddress: 'sato.jiro@example.com',
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
      searchKey: '山田太郎',
      searchKeyType: 'name',
    };

    const result = await deduplicateAndIdentifyCustomer(input);

    expect(result.status).toBe('identified');
    expect(result.identifiedCustomer?.customerId).toBe('CUST001');
    expect(result.identifiedCustomer?.customerName).toBe('山田太郎');
    expect(result.identifiedCustomer?.phoneNumber).toBe('09012345678');
    expect(result.identifiedCustomer?.emailAddress).toBe('yamada.taro@example.com');
    expect(result.deduplicationCandidates).toEqual([]);
  });
});
