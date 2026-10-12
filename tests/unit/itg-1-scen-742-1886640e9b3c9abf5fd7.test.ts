import { saveCustomer } from '../../src/logic/data-persistence';
import * as platform from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-742: メールアドレスが指定されていない場合は形式チェックをスキップして保存する', () => {
  it('SaveCustomerOutputが返され、メールアドレスが null でエラーが発生しない', async () => {
    const mockDataStore = platform as jest.Mocked<typeof platform>;

    const customerId = 'cust-001-uuid';

    (mockDataStore.listRecords as jest.Mock).mockResolvedValue([]);

    (mockDataStore.createRecord as jest.Mock).mockResolvedValue({
      customerId,
      customerName: '株式会社テスト商社',
      customerNameKana: 'カブシキガイシャテストショウシャ',
      customerCategory: '顧客',
      postalCode: null,
      address: '東京都渋谷区',
      phoneNumber: '03-1234-5678',
      emailAddress: null,
      contactPersonName: '山田太郎',
      paymentTerms: '月末締め翌月末払い',
      invoiceAddress: '東京都渋谷区請求先',
      invoiceEmailAddress: 'invoice@example.com',
      status: '有効',
      createdAt: '2026-10-07T12:34:56.000Z',
      updatedAt: '2026-10-07T12:34:56.000Z',
      createdBy: 'user-001',
      updatedBy: 'user-001',
    });

    const input = {
      customerId: null,
      customerName: '株式会社テスト商社',
      customerNameKana: 'カブシキガイシャテストショウシャ',
      customerCategory: '顧客',
      postalCode: null,
      address: '東京都渋谷区',
      phoneNumber: '03-1234-5678',
      emailAddress: null,
      contactPersonName: '山田太郎',
      paymentTerms: '月末締め翌月末払い',
      invoiceAddress: '東京都渋谷区請求先',
      invoiceEmailAddress: 'invoice@example.com',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T12:34:56.000Z',
    };

    const result = await saveCustomer(input);

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('株式会社テスト商社');
    expect(result.customerNameKana).toBe('カブシキガイシャテストショウシャ');
    expect(result.customerCategory).toBe('顧客');
    expect(result.postalCode).toBeNull();
    expect(result.address).toBe('東京都渋谷区');
    expect(result.phoneNumber).toBe('03-1234-5678');
    expect(result.emailAddress).toBeNull();
    expect(result.contactPersonName).toBe('山田太郎');
    expect(result.paymentTerms).toBe('月末締め翌月末払い');
    expect(result.invoiceAddress).toBe('東京都渋谷区請求先');
    expect(result.invoiceEmailAddress).toBe('invoice@example.com');
    expect(result.status).toBe('有効');
    expect(result.createdAt).toBe('2026-10-07T12:34:56.000Z');
    expect(result.updatedAt).toBe('2026-10-07T12:34:56.000Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedBy).toBe('user-001');

    expect(mockDataStore.createRecord).toHaveBeenCalledWith(
      '取引先',
      expect.objectContaining({
        customerName: '株式会社テスト商社',
        emailAddress: null,
      })
    );
  });
});
