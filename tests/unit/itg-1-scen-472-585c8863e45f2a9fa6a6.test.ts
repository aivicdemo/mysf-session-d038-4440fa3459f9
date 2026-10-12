import { displayCustomerTransactionHistory, SystemError } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-472: データベースクエリがタイムアウトした場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SystemErrorが発生し、エラー文言が返される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    const timeoutError = new Error('Database query timeout');

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockRejectedValue(
      timeoutError
    );

    await expect(
      displayCustomerTransactionHistory({
        customerId,
        loginUserId,
        currentDateTime,
      })
    ).rejects.toThrow(SystemError);
  });
});
