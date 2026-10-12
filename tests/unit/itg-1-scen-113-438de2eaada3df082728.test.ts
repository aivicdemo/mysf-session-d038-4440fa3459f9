import { generateInvoiceFromDeal, InvoiceGenerationPrerequisitesNotMet } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-113: 商談から請求書生成に必要なフィールドが不足または不正値であるとき、InvoiceGenerationPrerequisitesNotMetエラーが発生する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const currentDateTime = new Date('2026-10-07T10:30:00.000Z');
  const executingUserId = 'user-12345';

  const dealData = {
    dealId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({ deal: dealData });
  });

  it('should throw InvoiceGenerationPrerequisitesNotMet error when prerequisites are not met', async () => {
    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow(InvoiceGenerationPrerequisitesNotMet);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('請求書生成に必要な商談情報が不足しています。商談の詳細を確認してください。');
  });

  it('should not call saveInvoice when prerequisites are not met', async () => {
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
