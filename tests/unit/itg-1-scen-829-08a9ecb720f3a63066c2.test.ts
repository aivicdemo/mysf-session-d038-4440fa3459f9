import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchCustomerById } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store.ts')>('../../src/platform/data-store.ts'),
  listRecords: jest.fn() as unknown as (tableName: string) => Promise<any[]>,
}));

describe('SCEN-829: fetchCustomerById ISO 8601 date format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return FetchCustomerByIdOutput with ISO 8601 formatted dates', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: 'テスト株式会社',
      customerNameKana: 'テストカブシキガイシャ',
      customerCategory: '得意先',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@test-corp.jp',
      contactPersonName: '山田太郎',
      paymentTerms: '末日締め翌月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-1',
      invoiceEmailAddress: 'billing@test-corp.jp',
      status: 'active',
      createdAt: '2024-01-15T09:30:45.123Z',
      updatedAt: '2024-06-20T14:25:30.456Z',
      createdBy: 'user001',
      updatedBy: 'user002'
    };

    const mockDataStore = require('../../src/platform/data-store.ts') as any;
    mockDataStore.listRecords.mockResolvedValueOnce([mockRecord]);

    const result = await fetchCustomerById({ customerId });

    expect(result).toEqual({
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: 'テスト株式会社',
      customerNameKana: 'テストカブシキガイシャ',
      customerCategory: '得意先',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@test-corp.jp',
      contactPersonName: '山田太郎',
      paymentTerms: '末日締め翌月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-1',
      invoiceEmailAddress: 'billing@test-corp.jp',
      status: 'active',
      createdAt: '2024-01-15T09:30:45.123Z',
      updatedAt: '2024-06-20T14:25:30.456Z',
      createdBy: 'user001',
      updatedBy: 'user002'
    });

    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });
});
