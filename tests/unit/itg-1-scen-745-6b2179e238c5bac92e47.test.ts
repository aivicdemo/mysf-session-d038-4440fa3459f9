import { saveCustomer, SaveCustomerInput, SaveCustomerOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-745: 新規作成時にcreatedAtとcreatedByが操作日時と操作者で設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成フロー（customerId が null）でcreatedAt/createdBy/updatedAt/updatedByが正しく設定される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    const mockCreateRecord = jest.mocked(dataStore.createRecord);

    mockListRecords.mockResolvedValue([]);
    mockCreateRecord.mockResolvedValue({
      id: 'cust-uuid',
      customerId: 'cust-uuid',
      customerName: '株式会社テスト商事',
      customerNameKana: 'カブシキガイシャテストショウジ',
      customerCategory: '顧客',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'info@test-shoji.jp',
      contactPersonName: '山田太郎',
      paymentTerms: '翌月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-2',
      invoiceEmailAddress: 'invoice@test-shoji.jp',
      status: '有効',
      createdAt: '2025-02-15T10:30:45.123Z',
      updatedAt: '2025-02-15T10:30:45.123Z',
      createdBy: 'user-001',
      updatedBy: 'user-001',
    });

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '株式会社テスト商事',
      customerNameKana: 'カブシキガイシャテストショウジ',
      customerCategory: '顧客',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'info@test-shoji.jp',
      contactPersonName: '山田太郎',
      paymentTerms: '翌月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-2',
      invoiceEmailAddress: 'invoice@test-shoji.jp',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2025-02-15T10:30:45.123Z',
    };

    const result = await saveCustomer(input);

    expect(result.createdAt).toBe('2025-02-15T10:30:45.123Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedAt).toBe('2025-02-15T10:30:45.123Z');
    expect(result.updatedBy).toBe('user-001');
    expect(result.customerName).toBe('株式会社テスト商事');
    expect(result.customerNameKana).toBe('カブシキガイシャテストショウジ');
    expect(result.customerCategory).toBe('顧客');
    expect(result.postalCode).toBe('100-0001');
    expect(result.address).toBe('東京都千代田区丸の内1-1-1');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.emailAddress).toBe('info@test-shoji.jp');
    expect(result.contactPersonName).toBe('山田太郎');
    expect(result.paymentTerms).toBe('翌月末払い');
    expect(result.invoiceAddress).toBe('東京都千代田区丸の内1-1-2');
    expect(result.invoiceEmailAddress).toBe('invoice@test-shoji.jp');
    expect(result.status).toBe('有効');
  });
});
