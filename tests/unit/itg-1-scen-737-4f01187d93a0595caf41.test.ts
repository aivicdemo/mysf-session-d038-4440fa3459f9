import { saveCustomer, SaveCustomerInput, InvalidCustomerDataError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-737: 取引先名がnullの場合にエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidCustomerDataError when customerName is null', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: null as any,
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
      currentUserId: 'user-123',
      operationTimestamp: '2026-10-07T12:00:00.000Z'
    };

    await expect(saveCustomer(input)).rejects.toThrow(InvalidCustomerDataError);
    await expect(saveCustomer(input)).rejects.toThrow('取引先名は必須項目です。');

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
