import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchCustomerById } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-825: fetchCustomerById - 取引先情報を正常に取得', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された取引先IDに対応する取引先レコードが存在する場合、取引先の全フィールド情報を正常に取得できる', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomer = {
      id: customerId,
      取引先ID: customerId,
      取引先名: '株式会社テストカンパニー',
      取引先名カナ: 'カブシキガイシャテストカンパニー',
      取引先区分: '得意先',
      郵便番号: '100-0001',
      住所: '東京都千代田区丸の内1-1-1',
      電話番号: '03-1234-5678',
      メールアドレス: 'contact@test-company.jp',
      担当者名: '山田太郎',
      支払条件: '月末締め翌月末払い',
      請求先住所: '東京都千代田区丸の内2-2-2',
      請求先メールアドレス: 'billing@test-company.jp',
      ステータス: '有効',
      createdAt: '2025-01-15T09:30:00.000Z',
      updatedAt: '2025-02-20T14:45:00.000Z',
      作成者: 'admin@company.jp',
      更新者: 'manager@company.jp',
    };

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '取引先') {
        return Promise.resolve([mockCustomer as any]);
      }
      return Promise.resolve([]);
    });

    const result = await fetchCustomerById({ customerId });

    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerName).toBe('株式会社テストカンパニー');
    expect(result.customerNameKana).toBe('カブシキガイシャテストカンパニー');
    expect(result.customerCategory).toBe('得意先');
    expect(result.postalCode).toBe('100-0001');
    expect(result.address).toBe('東京都千代田区丸の内1-1-1');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.emailAddress).toBe('contact@test-company.jp');
    expect(result.contactPersonName).toBe('山田太郎');
    expect(result.paymentTerms).toBe('月末締め翌月末払い');
    expect(result.invoiceAddress).toBe('東京都千代田区丸の内2-2-2');
    expect(result.invoiceEmailAddress).toBe('billing@test-company.jp');
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe('2025-01-15T09:30:00.000Z');
    expect(result.updatedAt).toBe('2025-02-20T14:45:00.000Z');
    expect(result.createdBy).toBe('admin@company.jp');
    expect(result.updatedBy).toBe('manager@company.jp');
  });
});
