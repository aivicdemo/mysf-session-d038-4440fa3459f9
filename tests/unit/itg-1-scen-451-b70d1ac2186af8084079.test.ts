import { displayCustomerTransactionHistory, CustomerNotFound } from '../../src/logic/customer-transaction-history';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as accessControl from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-451: エラー：指定された顧客IDが存在しない、またはアクセス権限がない、またはデータ取得に失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CustomerNotFound エラーが発生する', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-12345';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    const mockAccessControlResponse = {
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: [],
        visibleInvoiceIds: [],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [],
    };

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockAccessControlResponse);
    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue(null);

    await expect(
      displayCustomerTransactionHistory({
        customerId,
        loginUserId,
        currentDateTime,
      }),
    ).rejects.toThrow(CustomerNotFound);

    await expect(
      displayCustomerTransactionHistory({
        customerId,
        loginUserId,
        currentDateTime,
      }),
    ).rejects.toThrow('顧客が見つかりません。顧客IDを確認してください。');
  });
});
