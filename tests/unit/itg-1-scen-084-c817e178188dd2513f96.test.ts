import { reconcileDealAndInvoice, DealNotFound } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-084: 商談IDが存在しない場合、DealNotFoundエラーを返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue(null);
  });

  test('fetchDealByIdがnullを返す場合、DealNotFoundエラーが throw される', async () => {
    await expect(
      reconcileDealAndInvoice({
        dealId,
        targetPeriodStart,
        targetPeriodEnd,
      }),
    ).rejects.toThrow(DealNotFound);

    await expect(
      reconcileDealAndInvoice({
        dealId,
        targetPeriodStart,
        targetPeriodEnd,
      }),
    ).rejects.toThrow('商談が見つかりません。商談IDを確認してください。');
  });
});
