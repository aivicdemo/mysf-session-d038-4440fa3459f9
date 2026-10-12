import { validateInvoiceReferenceIntegrity, NoInvoicesLinked } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
}));

describe('SCEN-103: 商談に紐付く請求書が1件も存在しない場合、NoInvoicesLinked エラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchInvoicesForPeriod が空配列を返す場合、NoInvoicesLinked エラーが発生する', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: 'cust-001',
      dealAmount: 500000,
      status: 'closed_won',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(
      mockDealRecord
    );
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);

    await expect(
      validateInvoiceReferenceIntegrity({ dealId })
    ).rejects.toThrow(NoInvoicesLinked);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalledWith(dealId);
  });
});
