import { generateInvoiceFromDeal, DealNotFound } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-112: 商談IDが存在しないとき、DealNotFoundエラーが発生する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const currentDateTime = new Date('2026-10-07T10:30:00.000Z');
  const executingUserId = 'user-exec-001';

  beforeEach(() => {
    jest.clearAllMocks();
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);
  });

  it('should throw DealNotFound error when deal does not exist', async () => {
    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow(DealNotFound);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('商談が見つかりません。商談IDを確認してください。');
  });
});
