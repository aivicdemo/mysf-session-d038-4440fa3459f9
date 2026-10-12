import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-709: 金額計算が正しい場合、新規レコードを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規レコードが正常に保存され返される', async () => {
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
        invoiceDate: '2026-10-01T00:00:00.000Z',
        dueDate: '2026-10-31T00:00:00.000Z',
        totalAmount: 550000,
        taxAmount: 50000,
        subtotalAmount: 500000,
        status: 'draft',
        paidDate: null,
        paidAmount: 0,
        remarks: null,
        createdAt: '2026-10-07T09:00:00.000Z',
        updatedAt: '2026-10-07T09:00:00.000Z',
        createdBy: 'user-11111',
        modificationPreviousAmount: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissueDate: null,
        amountCalculationValidationStatus: 'pending',
        amountCalculationValidationDate: null,
        referenceValidationStatus: 'pending',
      }])
      .mockResolvedValueOnce([{
        id: '660e8400-e29b-41d4-a716-446655440001',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesPersonId: '880e8400-e29b-41d4-a716-446655440003',
        dealName: 'クラウドサービス導入プロジェクト',
        dealAmount: 550000,
        stage: 'won',
        expectedClosingDate: '2026-10-01T00:00:00.000Z',
        description: '大規模顧客向けクラウドサービス導入',
        closingDate: '2026-10-01T00:00:00.000Z',
        lossReason: null,
        createdAt: '2026-09-20T08:00:00.000Z',
        updatedAt: '2026-10-01T15:00:00.000Z',
        createdBy: 'user-11111',
        invoiceSLADeadline: '2026-10-10T00:00:00.000Z',
        invoiceSLAOverdueFlag: false,
      }])
      .mockResolvedValueOnce([]) // 請求明細テーブルは空
      .mockResolvedValueOnce({
        id: 'generated-uuid-001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        activityId: null,
        lineNumber: 1,
        productName: 'クラウドサービス年間ライセンス',
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
        createdAt: '2026-10-07T10:30:00.000Z',
        updatedAt: '2026-10-07T10:30:00.000Z',
        createdBy: 'user-12345',
      }); // 保存後のレコード

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      activityId: null,
      lineNumber: 1,
      productName: 'クラウドサービス年間ライセンス',
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
      currentUserId: 'user-12345',
      operationTimestamp: '2026-10-07T10:30:00.000Z',
    };

    const result = await saveInvoiceLineItem(input);

    expect(result).toBeDefined();
    expect(result.lineItemId).not.toBeNull();
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.dealId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.createdBy).toBe('user-12345');
    expect(result.quantity).toBe(10);
    expect(result.unitPrice).toBe(50000);
    expect(result.amount).toBe(500000);
    expect(result.taxAmount).toBe(50000);
    expect(result.taxIncludedAmount).toBe(550000);
  });
});
