import { saveCustomer, SaveCustomerInput, SaveCustomerOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-746: 更新時にupdatedAtとupdatedByが操作日時と操作者で更新される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新フロー（customerId が存在）でupdatedAt/updatedByが更新される一方、createdAt/createdByは保持される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    const mockUpdateRecord = jest.mocked(dataStore.updateRecord);

    const existingRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: '株式会社サンプル',
      customerNameKana: 'カブシキガイシャサンプル',
      customerCategory: '顧客',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@sample.co.jp',
      contactPersonName: '鈴木花子',
      paymentTerms: '月末締め翌々月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-1',
      invoiceEmailAddress: 'old-invoice@sample.co.jp',
      status: '有効',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-15T14:20:30.000Z',
      createdBy: 'user-admin',
      updatedBy: 'user-002',
    };

    mockListRecords.mockResolvedValue([existingRecord]);
    mockUpdateRecord.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: '株式会社サンプル',
      customerNameKana: 'カブシキガイシャサンプル',
      customerCategory: '顧客',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@sample.co.jp',
      contactPersonName: '山田太郎',
      paymentTerms: '月末締め翌月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-1',
      invoiceEmailAddress: 'invoice@sample.co.jp',
      status: '有効',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-10-07T10:30:45.000Z',
      createdBy: 'user-admin',
      updatedBy: 'user-001',
    });

    const input: SaveCustomerInput = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      customerName: '株式会社サンプル',
      customerNameKana: 'カブシキガイシャサンプル',
      customerCategory: '顧客',
      postalCode: '100-0001',
      address: '東京都千代田区丸の内1-1-1',
      phoneNumber: '03-1234-5678',
      emailAddress: 'contact@sample.co.jp',
      contactPersonName: '山田太郎',
      paymentTerms: '月末締め翌月末払い',
      invoiceAddress: '東京都千代田区丸の内1-1-1',
      invoiceEmailAddress: 'invoice@sample.co.jp',
      status: '有効',
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:45.000Z',
    };

    const result = await saveCustomer(input);

    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerName).toBe('株式会社サンプル');
    expect(result.contactPersonName).toBe('山田太郎');
    expect(result.invoiceEmailAddress).toBe('invoice@sample.co.jp');
    expect(result.createdAt).toBe('2026-09-01T09:00:00.000Z');
    expect(result.createdBy).toBe('user-admin');
    expect(result.updatedAt).toBe('2026-10-07T10:30:45.000Z');
    expect(result.updatedBy).toBe('user-001');
  });
});
