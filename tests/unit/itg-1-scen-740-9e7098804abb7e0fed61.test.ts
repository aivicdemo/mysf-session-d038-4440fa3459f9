import { saveCustomer, SaveCustomerInput, InvalidPostalCodeFormatError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-740: 郵便番号の形式がXXX-XXXX形式でない場合にエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidPostalCodeFormatError when postalCode is not in XXX-XXXX format', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '株式会社テスト',
      customerNameKana: null,
      customerCategory: null,
      postalCode: '12345',
      address: null,
      phoneNumber: null,
      emailAddress: null,
      contactPersonName: null,
      paymentTerms: null,
      invoiceAddress: null,
      invoiceEmailAddress: null,
      status: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00Z'
    };

    await expect(saveCustomer(input)).rejects.toThrow(InvalidPostalCodeFormatError);
    await expect(saveCustomer(input)).rejects.toThrow('郵便番号の形式が不正です。');

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
