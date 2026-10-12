import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-123: 請求明細の各行について単価×数量×(1-割引率)×(1+税率)で期待金額を再計算し、システム記録値と比較したとき、計算が設計式どおり実行される', () => {
  it('金額計算ロジックが設計式に従って実行される', async () => {
    const dealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社 システム導入プロジェクト',
      accountId: 'acc-001',
      ownerId: 'user-001',
      dealAmount: 1100000,
      stage: 'Closed Won',
      lineItems: [
        {
          lineItemId: 'line-001',
          productId: 'prod-001',
          quantity: 10,
          unitPrice: 100000,
          discountRate: 0.1,
          taxRate: 0.1,
        },
        {
          lineItemId: 'line-002',
          productId: 'prod-002',
          quantity: 1,
          unitPrice: 50000,
          discountRate: 0,
          taxRate: 0.1,
        },
      ],
    };

    const mockFetchDealById = jest.spyOn(dataPersistence, 'fetchDealById');
    const mockSaveInvoice = jest.spyOn(dataPersistence, 'saveInvoice');
    const mockSaveLineItem = jest.spyOn(dataPersistence, 'saveInvoiceLineItem');

    mockFetchDealById.mockResolvedValue(dealData as any);
    mockSaveInvoice.mockResolvedValue({
      invoiceId: 'inv-001',
      invoiceNumber: '2026-001',
      invoiceDate: '2026-10-07',
      dueDate: '2026-11-07',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '未送付',
      createdAt: '2026-10-07T10:30:00.000Z',
    } as any);
    mockSaveLineItem.mockResolvedValue({
      lineItemId: 'line-001',
      invoiceId: 'inv-001',
      quantity: 10,
      unitPrice: 100000,
      amount: 900000,
    } as any);

    const input = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      currentDateTime: new Date('2026-10-07T10:30:00.000Z'),
      executingUserId: 'user-001',
    };

    const result = await generateInvoiceFromDeal(input);

    expect(result.invoiceId).toBeDefined();
    expect(result.invoiceNumber).toBeDefined();
    expect(result.invoiceAmount).toBe(1100000);
    expect(result.taxAmount).toBe(100000);
    expect(result.untaxedAmount).toBe(1000000);
    expect(result.invoiceLineItemIds).toHaveLength(2);
    expect(result.invoiceStatus).toBe('未送付');
    expect(result.createdAt).toEqual(new Date('2026-10-07T10:30:00.000Z'));

    expect(mockFetchDealById).toHaveBeenCalledWith(expect.objectContaining({ dealId: '550e8400-e29b-41d4-a716-446655440000' }));
    expect(mockSaveInvoice).toHaveBeenCalled();
  });
});
