import { saveCustomer, SaveCustomerInput, SaveCustomerOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-734: 新規取引先を作成して保存する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new customer with a generated UUID', async () => {
    const mockCustomerId = 'c1234567-89ab-cdef-0123-456789abcdef';
    const now = '2026-10-07T10:30:00Z';

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      取引先ID: mockCustomerId,
      取引先名: '株式会社サンプル',
      取引先名カナ: 'カブシキガイシャサンプル',
      取引先区分: '顧客',
      郵便番号: '100-0001',
      住所: '東京都千代田区千代田1-1-1',
      電話番号: '03-1234-5678',
      メールアドレス: 'info@example.com',
      担当者名: '山田太郎',
      支払条件: '月末締め翌月末払い',
      請求先住所: '東京都千代田区千代田1-1-1',
      請求先メールアドレス: 'invoice@example.com',
      ステータス: '有効',
      createdAt: now,
      updatedAt: now,
      作成者: 'user-001',
      更新者: 'user-001'
    });

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '株式会社サンプル',
      customerNameKana: 'カブシキガイシャサンプル',
      customerCategory: '顧客',
      postalCode: '100-0001',
      address: '東京都千代田区千代田1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'info@example.com',
      contactPersonName: '山田太郎',
      paymentTerms: '月末締め翌月末払い',
      invoiceAddress: '東京都千代田区千代田1-1-1',
      invoiceEmailAddress: 'invoice@example.com',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: now
    };

    const result = await saveCustomer(input);

    expect(result).toBeDefined();
    expect(result.customerId).toBe(mockCustomerId);
    expect(result.customerId).not.toBeNull();
    expect(result.customerName).toBe('株式会社サンプル');
    expect(result.customerNameKana).toBe('カブシキガイシャサンプル');
    expect(result.customerCategory).toBe('顧客');
    expect(result.postalCode).toBe('100-0001');
    expect(result.address).toBe('東京都千代田区千代田1-1-1');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.emailAddress).toBe('info@example.com');
    expect(result.contactPersonName).toBe('山田太郎');
    expect(result.paymentTerms).toBe('月末締め翌月末払い');
    expect(result.invoiceAddress).toBe('東京都千代田区千代田1-1-1');
    expect(result.invoiceEmailAddress).toBe('invoice@example.com');
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe(now);
    expect(result.updatedAt).toBe(now);
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toBe('user-001');

    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
