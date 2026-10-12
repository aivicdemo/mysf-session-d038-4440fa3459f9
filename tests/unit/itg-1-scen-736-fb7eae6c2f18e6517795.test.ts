import { saveCustomer, SaveCustomerInput, InvalidCustomerDataError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-736: 取引先名が空文字列の場合にエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidCustomerDataError when customerName is empty string', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: '',
      customerNameKana: null,
      customerCategory: null,
      postalCode: null,
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

    await expect(saveCustomer(input)).rejects.toThrow(InvalidCustomerDataError);
    await expect(saveCustomer(input)).rejects.toThrow('取引先名は必須項目です。');

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
