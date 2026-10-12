import { validateInvoiceReferenceIntegrity, DealNotFound } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchDealById: jest.fn(),
}));

describe('SCEN-102: 商談IDに対応するレコードが存在しない場合、DealNotFound エラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchDealById が null を返す場合、DealNotFound エラーが発生する', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);

    await expect(
      validateInvoiceReferenceIntegrity({ dealId })
    ).rejects.toThrow(DealNotFound);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
  });
});
