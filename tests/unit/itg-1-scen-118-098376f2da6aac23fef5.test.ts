import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');

describe('SCEN-118: 請求明細の行アイテムが空のとき、validateInvoiceCalculationLogicが例外発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error with message about no line items when invoiceLineItems is empty', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const currentDateTime = new Date('2026-10-15T09:30:00.000Z');
    const executingUserId = 'user-001';

    const dealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const invoiceGenerationPrerequisites = {
      isValid: true,
    };

    const calculatedAmountAndTax = {
      untaxedAmount: 90909.09,
      taxAmount: 9090.91,
      invoiceAmount: 100000,
    };

    const amountCalculationValidation = {
      isValid: true,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealData);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('請求明細が存在しません。データを確認してください');
  });
});
