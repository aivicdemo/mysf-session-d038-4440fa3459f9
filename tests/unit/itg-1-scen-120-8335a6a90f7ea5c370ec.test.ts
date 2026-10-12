import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-120: 単価・数量・割引率・税率のいずれかが負の値のとき、例外発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when unitPrice is negative', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const currentDateTime = new Date('2026-10-07T10:00:00.000Z');
    const executingUserId = 'user-12345';

    const dealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト案件',
      accountId: 'acc-001',
      ownerId: 'user-001',
      amount: 100000,
      stage: 'クローズド/成約',
      lineItems: [{
        lineItemId: 'line-001',
        productId: 'prod-001',
        quantity: 10,
        unitPrice: -1000,
        discountRate: 0.1,
        taxRate: 0.1,
      }],
    };

    const invoiceGenerationPrerequisites = {
      isValid: true,
      missingFields: [],
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealData);

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow('単価・数量・割引率・税率は負の値を指定できません');
  });
});
