import { generateInvoiceFromDeal, AmountCalculationFailed } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-114: 商談金額から請求金額・税額を計算できないとき、AmountCalculationFailedエラーが発生する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const currentDateTime = new Date('2026-01-15T10:30:00Z');
  const executingUserId = 'user-exec-001';

  const dealData = {
    dealId,
    dealName: 'テスト商談',
    dealAmount: 100000,
    dealStage: '受注',
    accountId: 'acc-001',
    ownerId: 'user-owner-001',
    lineItems: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({ deal: dealData });
  });

  it('should throw AmountCalculationFailed error when amount calculation cannot proceed', async () => {
    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow(AmountCalculationFailed);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('請求金額の計算に失敗しました。商談金額と税率を確認してください。');
  });

  it('should not save invoice when amount calculation fails', async () => {
    try {
      await generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      });
    } catch {
      // Error is expected
    }

    expect(dataPersistence.saveInvoice).not.toHaveBeenCalled();
  });
});
