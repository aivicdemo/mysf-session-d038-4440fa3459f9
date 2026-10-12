import { judgeInvoiceStatusConsistency } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-279: 商談ステータスが定義済みの値以外の不正な値の場合、業務ルールの制約により検証は実行せず例外を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when deal status is invalid', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-15T10:30:00Z');

    const mockDeal = {
      dealId,
      dealStatus: 'INVALID_STATUS',
      dealAmount: 100000,
      dealClosedDate: new Date('2026-10-15T00:00:00Z'),
    };

    (dataPersistence.fetchDealById as jest.Mock) = jest.fn().mockResolvedValue(mockDeal);

    await expect(
      judgeInvoiceStatusConsistency({
        dealId,
        executedAt,
      })
    ).rejects.toThrow('商談ステータスが不正です');

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
  });
});
