import { saveCustomer, InvalidPostalCodeFormatError, type SaveCustomerInput, type SaveCustomerOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-744: saveCustomer - 郵便番号が指定されていない場合は形式チェックをスキップして保存する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveCustomer は postalCode=null の場合、郵便番号形式チェックをスキップして保存する', async () => {
    // 前提条件
    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '株式会社テスト商社',
      customerNameKana: 'カブシキガイシャテストショウシャ',
      customerCategory: '顧客',
      postalCode: null,
      address: '東京都渋谷区道玄坂1-2-3',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@test-shosha.jp',
      contactPersonName: '営業太郎',
      paymentTerms: '末月払い30日',
      invoiceAddress: '東京都渋谷区道玄坂1-2-3',
      invoiceEmailAddress: 'invoice@test-shosha.jp',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    const mockStoreListRecords = jest.fn().mockResolvedValue([]);
    const mockStoreCreateRecord = jest.fn().mockResolvedValue({
      customerId: 'generated-uuid-002',
      customerName: input.customerName,
      customerNameKana: input.customerNameKana,
      customerCategory: input.customerCategory,
      postalCode: input.postalCode,
      address: input.address,
      phoneNumber: input.phoneNumber,
      emailAddress: input.emailAddress,
      contactPersonName: input.contactPersonName,
      paymentTerms: input.paymentTerms,
      invoiceAddress: input.invoiceAddress,
      invoiceEmailAddress: input.invoiceEmailAddress,
      status: input.status,
      createdAt: input.operationTimestamp,
      updatedAt: input.operationTimestamp,
      createdBy: input.currentUserId,
      updatedBy: input.currentUserId,
    });

    (dataStore.listRecords as jest.Mock).mockImplementation((table) => {
      if (table === '取引先') {
        return mockStoreListRecords();
      }
      return Promise.resolve([]);
    });

    (dataStore.createRecord as jest.Mock).mockImplementation((table, record) => {
      if (table === '取引先') {
        return mockStoreCreateRecord();
      }
      return Promise.resolve({});
    });

    // テスト実行
    const result = await saveCustomer(input);

    // 期待結果確認
    expect(result).toBeDefined();
    expect(result.customerId).toBe('generated-uuid-002');
    expect(result.customerName).toBe('株式会社テスト商社');
    expect(result.customerNameKana).toBe('カブシキガイシャテストショウシャ');
    expect(result.customerCategory).toBe('顧客');
    expect(result.postalCode).toBeNull();
    expect(result.address).toBe('東京都渋谷区道玄坂1-2-3');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.emailAddress).toBe('contact@test-shosha.jp');
    expect(result.contactPersonName).toBe('営業太郎');
    expect(result.paymentTerms).toBe('末月払い30日');
    expect(result.invoiceAddress).toBe('東京都渋谷区道玄坂1-2-3');
    expect(result.invoiceEmailAddress).toBe('invoice@test-shosha.jp');
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe('2026-10-07T10:30:00Z');
    expect(result.updatedAt).toBe('2026-10-07T10:30:00Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toBe('user-001');

    // createRecord が呼ばれたことを確認
    expect(dataStore.createRecord).toHaveBeenCalled();
  });

  it('saveCustomer は postalCode=null の場合、InvalidPostalCodeFormatError を発生させない', async () => {
    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '株式会社テスト商社',
      customerNameKana: 'カブシキガイシャテストショウシャ',
      customerCategory: '顧客',
      postalCode: null,
      address: '東京都渋谷区道玄坂1-2-3',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@test-shosha.jp',
      contactPersonName: '営業太郎',
      paymentTerms: '末月払い30日',
      invoiceAddress: '東京都渋谷区道玄坂1-2-3',
      invoiceEmailAddress: 'invoice@test-shosha.jp',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);
    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      customerId: 'generated-uuid-002',
      customerName: input.customerName,
      customerNameKana: input.customerNameKana,
      customerCategory: input.customerCategory,
      postalCode: input.postalCode,
      address: input.address,
      phoneNumber: input.phoneNumber,
      emailAddress: input.emailAddress,
      contactPersonName: input.contactPersonName,
      paymentTerms: input.paymentTerms,
      invoiceAddress: input.invoiceAddress,
      invoiceEmailAddress: input.invoiceEmailAddress,
      status: input.status,
      createdAt: input.operationTimestamp,
      updatedAt: input.operationTimestamp,
      createdBy: input.currentUserId,
      updatedBy: input.currentUserId,
    });

    // InvalidPostalCodeFormatError が発生しないことを確認
    await expect(saveCustomer(input)).resolves.toBeDefined();
  });
});
