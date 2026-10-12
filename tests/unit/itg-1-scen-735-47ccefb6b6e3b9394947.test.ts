import { saveCustomer, SaveCustomerInput, SaveCustomerOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-735: 既存取引先を更新して保存する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an existing customer and preserve createdAt and createdBy', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const createdAt = '2024-01-01T10:00:00Z';
    const createdBy = 'user-001';
    const updatedAt = '2024-11-15T14:30:00Z';
    const updatedBy = 'user-002';

    (dataStore.listRecords as jest.Mock).mockResolvedValue([{
      id: customerId,
      取引先ID: customerId,
      取引先名: '既存顧客A',
      取引先名カナ: 'キソンキャクA',
      取引先区分: '顧客',
      郵便番号: '100-0001',
      住所: '東京都千代田区丸の内1-1-1',
      電話番号: '03-1234-5678',
      メールアドレス: 'old@example.com',
      担当者名: '田中太郎',
      支払条件: '月末締め翌月末払い',
      請求先住所: '東京都千代田区丸の内1-2-1',
      請求先メールアドレス: 'billing@example.com',
      ステータス: '有効',
      createdAt: createdAt,
      updatedAt: createdAt,
      作成者: createdBy,
      更新者: createdBy
    }]);

    (dataStore.updateRecord as jest.Mock).mockResolvedValue({
      取引先ID: customerId,
      取引先名: '既存顧客A（更新版）',
      取引先名カナ: 'キソンキャクアコウシンハン',
      取引先区分: '顧客',
      郵便番号: '101-0021',
      住所: '東京都千代田区外神田1-1-1',
      電話番号: '03-9999-8888',
      メールアドレス: 'new@example.com',
      担当者名: '鈴木花子',
      支払条件: '月末締め翌々月末払い',
      請求先住所: '東京都千代田区外神田1-2-1',
      請求先メールアドレス: 'newinvoice@example.com',
      ステータス: '有効',
      createdAt: createdAt,
      updatedAt: updatedAt,
      作成者: createdBy,
      更新者: updatedBy
    });

    const input: SaveCustomerInput = {
      customerId: customerId,
      customerName: '既存顧客A（更新版）',
      customerNameKana: 'キソンキャクアコウシンハン',
      customerCategory: '顧客',
      postalCode: '101-0021',
      address: '東京都千代田区外神田1-1-1',
      phoneNumber: '03-9999-8888',
      emailAddress: 'new@example.com',
      contactPersonName: '鈴木花子',
      paymentTerms: '月末締め翌々月末払い',
      invoiceAddress: '東京都千代田区外神田1-2-1',
      invoiceEmailAddress: 'newinvoice@example.com',
      status: '有効',
      currentUserId: updatedBy,
      operationTimestamp: updatedAt
    };

    const result = await saveCustomer(input);

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('既存顧客A（更新版）');
    expect(result.customerNameKana).toBe('キソンキャクアコウシンハン');
    expect(result.customerCategory).toBe('顧客');
    expect(result.postalCode).toBe('101-0021');
    expect(result.address).toBe('東京都千代田区外神田1-1-1');
    expect(result.phoneNumber).toBe('03-9999-8888');
    expect(result.emailAddress).toBe('new@example.com');
    expect(result.contactPersonName).toBe('鈴木花子');
    expect(result.paymentTerms).toBe('月末締め翌々月末払い');
    expect(result.invoiceAddress).toBe('東京都千代田区外神田1-2-1');
    expect(result.invoiceEmailAddress).toBe('newinvoice@example.com');
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe(createdAt);
    expect(result.updatedAt).toBe(updatedAt);
    expect(result.createdBy).toBe(createdBy);
    expect(result.updatedBy).toBe(updatedBy);

    expect(dataStore.updateRecord).toHaveBeenCalled();
  });
});
