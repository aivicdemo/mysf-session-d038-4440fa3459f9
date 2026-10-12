import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-711: 商品説明と摘要が省略された場合、null のまま保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('productDescription と remarks が null のまま保存される', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：請求書と商談が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesPersonId: '880e8400-e29b-41d4-a716-446655440003',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-10-07T00:00:00.000Z',
        dueDate: '2026-11-07T00:00:00.000Z',
        totalAmount: 550000,
        taxAmount: 50000,
        subtotalAmount: 500000,
        status: 'draft',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        createdAt: '2026-10-07T11:00:00.000Z',
        updatedAt: '2026-10-07T11:00:00.000Z',
        createdBy: 'user-001',
      }])
      .mockResolvedValueOnce([{
        id: '660e8400-e29b-41d4-a716-446655440001',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesPersonId: '880e8400-e29b-41d4-a716-446655440003',
        dealName: 'テスト商談',
        dealAmount: 550000,
        stage: 'won',
        expectedClosingDate: '2026-10-01T00:00:00.000Z',
        description: 'テスト商談の説明',
        closingDate: '2026-10-01T00:00:00.000Z',
        lossReason: null,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-10-07T11:00:00.000Z',
        createdBy: 'user-001',
        invoiceSLADeadline: '2026-10-08T00:00:00.000Z',
        invoiceSLAOverdueFlag: false,
      }])
      .mockResolvedValueOnce([]) // 請求明細テーブルは空
      .mockResolvedValueOnce({
        id: 'new-uuid-line-001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        activityId: null,
        lineNumber: 1,
        productName: 'コンサルティングサービス',
        productDescription: null,
        quantity: 10,
        unitPrice: 50000,
        amount: 500000,
        taxRate: 10,
        taxAmount: 50000,
        taxIncludedAmount: 550000,
        remarks: null,
        modificationPreviousQuantity: null,
        modificationPreviousUnitPrice: null,
        modificationPreviousAmount: null,
        createdAt: '2026-10-07T12:00:00.000Z',
        updatedAt: '2026-10-07T12:00:00.000Z',
        createdBy: 'user-001',
      }); // 保存後のレコード

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      activityId: null,
      lineNumber: 1,
      productName: 'コンサルティングサービス',
      productDescription: null,
      quantity: 10,
      unitPrice: 50000,
      amount: 500000,
      taxRate: 10,
      taxAmount: 50000,
      taxIncludedAmount: 550000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T12:00:00.000Z',
    };

    const result = await saveInvoiceLineItem(input);

    expect(result.productDescription).toBeNull();
    expect(result.remarks).toBeNull();
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
