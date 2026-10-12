import { saveCustomer, SaveCustomerInput, InvalidPhoneFormatError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-739: 電話番号に数字とハイフン以外の文字が含まれている場合にエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidPhoneFormatError when phoneNumber contains invalid characters', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '株式会社テスト',
      customerNameKana: null,
      customerCategory: null,
      postalCode: null,
      address: null,
      phoneNumber: '090-1234-567#',
      emailAddress: null,
      contactPersonName: null,
      paymentTerms: null,
      invoiceAddress: null,
      invoiceEmailAddress: null,
      status: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:00:00.000Z'
    };

    await expect(saveCustomer(input)).rejects.toThrow(InvalidPhoneFormatError);
    await expect(saveCustomer(input)).rejects.toThrow('電話番号の形式が不正です。');

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
