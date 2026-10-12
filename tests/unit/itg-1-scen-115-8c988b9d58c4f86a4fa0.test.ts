import { generateInvoiceFromDeal, AmountCalculationValidationFailed } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-115: 計算された請求金額が金額計算ロジックの検証に失敗するとき、AmountCalculationValidationFailedエラーが発生する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const currentDateTime = new Date('2026-10-15T10:30:00.000Z');
  const executingUserId = 'user-001';

  const dealData = {
    dealId,
    dealName: '顧客A 年間保守契約',
    accountId: 'acc-001',
    ownerId: 'user-001',
    stage: '成約',
    closeDate: '2026-10-10',
    lineItems: [
      {
        lineItemId: 'line-item-001',
        quantity: 1,
        unitPrice: 600500,
        taxRate: 0.1,
      },
      {
        lineItemId: 'line-item-002',
        quantity: 1,
        unitPrice: 600000,
        taxRate: 0.1,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({ deal: dealData });
  });

  it('should throw AmountCalculationValidationFailed error when validation fails', async () => {
    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow(AmountCalculationValidationFailed);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('請求金額の検証に失敗しました。金額計算ロジックを確認してください。');
  });

  it('should not save invoice when validation fails', async () => {
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

  it('should not save invoice line items when validation fails', async () => {
    try {
      await generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      });
    } catch {
      // Error is expected
    }

    expect(dataPersistence.saveInvoiceLineItem).not.toHaveBeenCalled();
  });
});
