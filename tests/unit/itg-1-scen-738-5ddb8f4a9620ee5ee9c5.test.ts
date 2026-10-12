import { saveCustomer, SaveCustomerInput, InvalidEmailFormatError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-738: メールアドレスの形式が不正な場合にエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidEmailFormatError when emailAddress has invalid format', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: SaveCustomerInput = {
      customerId: null,
      customerName: 'テスト取引先',
      customerNameKana: null,
      customerCategory: null,
      postalCode: null,
      address: null,
      phoneNumber: null,
      emailAddress: 'invalid-email-format',
      contactPersonName: null,
      paymentTerms: null,
      invoiceAddress: null,
      invoiceEmailAddress: null,
      status: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00.000Z'
    };

    await expect(saveCustomer(input)).rejects.toThrow(InvalidEmailFormatError);
    await expect(saveCustomer(input)).rejects.toThrow('メールアドレスの形式が不正です。');

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
