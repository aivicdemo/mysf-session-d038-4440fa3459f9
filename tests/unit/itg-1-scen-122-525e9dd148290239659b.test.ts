import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');

describe('SCEN-122: 参照先の商品マスタが見つからないとき、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete successfully with warning when product master is not found', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const currentDateTime = new Date('2026-10-07T10:30:00Z');
    const executingUserId = 'user-001';

    const dealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト案件',
      dealAmount: 110000,
      dealStage: 'クローズ',
      accountId: 'account-001',
      salesRepId: 'sales-001',
    };

    const invoiceGenerationPrerequisites = {
      isValid: true,
      missingFields: [],
    };

    const calculatedAmountAndTax = {
      untaxedAmount: 100000,
      taxAmount: 10000,
      invoiceAmount: 110000,
    };

    const amountCalculationValidation = {
      isValid: false,
      discrepancies: [{
        type: '参照関係エラー',
        lineItemId: 'line-001',
        expectedValue: 0,
        actualValue: 0,
        difference: 0,
        severity: '高',
      }],
      summary: {
        totalLineItems: 1,
        discrepancyCount: 1,
        totalAmountDifference: 0,
      },
    };

    const invoiceData = {
      invoiceId: 'inv-550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'INV-2026-10-0001',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceLineItemIds: ['line-item-001'],
      invoiceStatus: '未送付',
      createdAt: new Date('2026-10-07T10:30:00Z'),
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealData);
    (dataPersistence.saveInvoice as jest.Mock).mockResolvedValue(invoiceData);
    (dataPersistence.saveInvoiceLineItem as jest.Mock).mockResolvedValue({ invoiceLineItemId: 'line-item-001' });
    (modificationTracking.recordModificationWithHistory as jest.Mock).mockResolvedValue({
      modificationId: 'mod-001',
      message: '参照先の商品マスタが見つかりません。商品マスタを確認してください',
    });

    const result = await generateInvoiceFromDeal({
      dealId,
      currentDateTime,
      executingUserId,
    });

    expect(result).toMatchObject({
      invoiceId: 'inv-550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'INV-2026-10-0001',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未送付',
    });

    expect(modificationTracking.recordModificationWithHistory as jest.Mock).toHaveBeenCalled();
    const callArgs = (modificationTracking.recordModificationWithHistory as jest.Mock).mock.calls[0][0];
    expect(callArgs).toEqual(
      expect.objectContaining({
        message: '参照先の商品マスタが見つかりません。商品マスタを確認してください',
      })
    );
  });
});
