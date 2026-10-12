import { judgeInvoiceStatusConsistency } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-281: 商談確定金額が0以下の場合、業務ルールの制約により検証は実行せず例外を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when deal amount is zero or negative', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-07T10:30:00.000Z');

    const mockDeal = {
      dealId,
      dealStatus: 'closed',
      dealAmount: -50000,
      dealClosedDate: new Date('2026-10-01T09:00:00.000Z'),
    };

    (dataPersistence.fetchDealById as jest.Mock) = jest.fn().mockResolvedValue(mockDeal);

    await expect(
      judgeInvoiceStatusConsistency({
        dealId,
        executedAt,
      })
    ).rejects.toThrow('商談金額が不正です');

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
  });
});
