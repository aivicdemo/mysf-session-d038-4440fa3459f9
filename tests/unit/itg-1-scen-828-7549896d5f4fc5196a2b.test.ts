import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchCustomerById } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store.ts')>('../../src/platform/data-store.ts'),
  listRecords: jest.fn() as unknown as (tableName: string) => Promise<any[]>,
}));

describe('SCEN-828: fetchCustomerById with null optional fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return FetchCustomerByIdOutput with all optional fields as null', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: '株式会社テスト',
      customerNameKana: null,
      customerCategory: null,
      postalCode: null,
      address: null,
      phoneNumber: null,
      emailAddress: null,
      contactPersonName: null,
      paymentTerms: null,
      invoiceAddress: null,
      invoiceEmailAddress: null,
      status: null,
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      createdBy: 'admin',
      updatedBy: 'admin'
    };

    const mockDataStore = require('../../src/platform/data-store.ts') as any;
    mockDataStore.listRecords.mockResolvedValueOnce([mockRecord]);

    const result = await fetchCustomerById({ customerId });

    expect(result).toEqual({
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: '株式会社テスト',
      customerNameKana: null,
      customerCategory: null,
      postalCode: null,
      address: null,
      phoneNumber: null,
      emailAddress: null,
      contactPersonName: null,
      paymentTerms: null,
      invoiceAddress: null,
      invoiceEmailAddress: null,
      status: null,
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      createdBy: 'admin',
      updatedBy: 'admin'
    });
  });
});
