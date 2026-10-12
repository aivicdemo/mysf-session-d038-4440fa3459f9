import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');

describe('SCEN-111: 商談が存在し、請求書生成の前提条件が満たされ、金額計算が正確であるとき、請求書と請求明細が正常に生成される', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const currentDateTime = new Date('2025-01-15T10:30:00Z');
  const executingUserId = 'user-001';

  const dealData = {
    dealId,
    dealName: 'A社システム導入案件',
    dealAmount: 1100000,
    stage: '契約済',
    accountId: 'account-001',
    accountName: 'A社',
    ownerUserId: 'salesuser-001',
    lineItems: [
      {
        productId: 'prod-001',
        productName: 'ライセンス',
        quantity: 100,
        unitPrice: 10000,
        discountRate: 0.1,
        taxRate: 0.1,
      },
      {
        productId: 'prod-002',
        productName: '導入サービス',
        quantity: 1,
        unitPrice: 100000,
        discountRate: 0,
        taxRate: 0.1,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({ deal: dealData });
    (dataPersistence.saveInvoice as jest.Mock).mockResolvedValue({
      invoiceId: '550e8400-e29b-41d4-a716-446655440001',
      invoiceNumber: 'INV-2025-001',
    });
    (dataPersistence.saveInvoiceLineItem as jest.Mock).mockResolvedValue({
      lineItemId: '550e8400-e29b-41d4-a716-446655440002',
    });
    (modificationTracking.recordModificationWithHistory as jest.Mock).mockResolvedValue({
      modificationRecordId: '550e8400-e29b-41d4-a716-446655440003',
    });
  });

  it('should generate invoice with correct amounts and line items', async () => {
    const result = await generateInvoiceFromDeal({
      dealId,
      currentDateTime,
      executingUserId,
    });

    expect(result.invoiceId).toBeDefined();
    expect(result.invoiceNumber).toBeDefined();
    expect(result.invoiceAmount).toBe(1100000);
    expect(result.taxAmount).toBe(100000);
    expect(result.untaxedAmount).toBe(1000000);
    expect(result.invoiceLineItemIds).toHaveLength(2);
    expect(result.invoiceStatus).toBe('未送付');
    expect(result.createdAt).toEqual(currentDateTime);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith({ dealId });
    expect(dataPersistence.saveInvoice).toHaveBeenCalled();
    expect(dataPersistence.saveInvoiceLineItem).toHaveBeenCalledTimes(2);
    expect(modificationTracking.recordModificationWithHistory).toHaveBeenCalled();
  });
});
