import { generateInvoiceFromDeal, InvoiceSaveFailure } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-116: 請求書レコードの保存に失敗したとき、InvoiceSaveFailureエラーが発生する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const currentDateTime = new Date('2026-10-07T10:30:00.000Z');
  const executingUserId = 'user-001';

  const dealData = {
    dealId,
    dealName: 'テスト商談',
    stage: '成約',
    accountId: 'acc-001',
    ownerId: 'user-001',
    lineItems: [
      {
        productId: 'prod-001',
        quantity: 1,
        unitPrice: 1100000,
        taxRate: 0.1,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({ deal: dealData });

    const saveInvoiceError = new Error('Database write failure');
    (dataPersistence.saveInvoice as jest.Mock).mockRejectedValue(saveInvoiceError);
  });

  it('should throw InvoiceSaveFailure error when invoice save fails', async () => {
    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow(InvoiceSaveFailure);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('請求書の保存に失敗しました。システム管理者に連絡してください。');
  });

  it('should attempt to save invoice and fail', async () => {
    try {
      await generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      });
    } catch {
      // Error is expected
    }

    expect(dataPersistence.saveInvoice).toHaveBeenCalled();
  });
});
