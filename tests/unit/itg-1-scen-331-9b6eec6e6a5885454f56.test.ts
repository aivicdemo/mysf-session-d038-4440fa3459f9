import { classifyInvoiceStatus, DealNotFound } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-331: 指定した商談IDが存在しない場合、DealNotFound エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchDealById が null を返す場合、DealNotFound エラーが発生する', async () => {
    const dealId = 'DEAL-99999';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow(DealNotFound);

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow('商談が見つかりません。商談ID: DEAL-99999');
  });
});
