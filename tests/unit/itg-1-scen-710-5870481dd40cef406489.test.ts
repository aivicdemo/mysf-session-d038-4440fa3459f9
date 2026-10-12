import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-710: 営業活動IDが省略された場合、null のまま保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('activityId が null のまま保存される', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：請求書と商談が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: 'invoice-uuid-001',
        invoiceId: 'invoice-uuid-001',
        dealId: 'deal-uuid-001',
        customerId: 'customer-uuid-001',
        salesPersonId: 'sales-uuid-001',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-10-01T00:00:00.000Z',
        dueDate: '2026-10-31T00:00:00.000Z',
        totalAmount: 1100000,
        taxAmount: 100000,
        subtotalAmount: 1000000,
        status: 'draft',
        paidDate: null,
        paidAmount: null,
        remarks: 'normal',
        createdAt: '2026-10-01T09:00:00.000Z',
        updatedAt: '2026-10-01T09:00:00.000Z',
        createdBy: 'user-uuid-001',
      }])
      .mockResolvedValueOnce([{
        id: 'deal-uuid-001',
        dealId: 'deal-uuid-001',
        customerId: 'customer-uuid-001',
        salesPersonId: 'sales-uuid-001',
        dealName: 'A社システム構築案件',
        dealAmount: 2000000,
        stage: 'won',
        expectedClosingDate: '2026-09-30T00:00:00.000Z',
        description: '大規模システム構築プロジェクト',
        closingDate: '2026-09-28T00:00:00.000Z',
        lossReason: null,
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-09-28T15:30:00.000Z',
        createdBy: 'user-uuid-001',
      }])
      .mockResolvedValueOnce([]) // 請求明細テーブルは空
      .mockResolvedValueOnce({
        id: 'new-uuid-line-001',
        invoiceId: 'invoice-uuid-001',
        dealId: 'deal-uuid-001',
        activityId: null,
        lineNumber: 1,
        productName: 'システム構築サービス',
        productDescription: null,
        quantity: 10,
        unitPrice: 100000,
        amount: 1000000,
        taxRate: 10,
        taxAmount: 100000,
        taxIncludedAmount: 1100000,
        remarks: null,
        modificationPreviousQuantity: null,
        modificationPreviousUnitPrice: null,
        modificationPreviousAmount: null,
        createdAt: '2026-10-07T10:30:00.000Z',
        updatedAt: '2026-10-07T10:30:00.000Z',
        createdBy: 'user-uuid-001',
      }); // 保存後のレコード

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId: 'invoice-uuid-001',
      dealId: 'deal-uuid-001',
      activityId: null,
      lineNumber: 1,
      productName: 'システム構築サービス',
      productDescription: null,
      quantity: 10,
      unitPrice: 100000,
      amount: 1000000,
      taxRate: 10,
      taxAmount: 100000,
      taxIncludedAmount: 1100000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2026-10-07T10:30:00.000Z',
    };

    const result = await saveInvoiceLineItem(input);

    expect(result.activityId).toBeNull();
    expect(result.lineNumber).toBe(1);
    expect(result.invoiceId).toBe('invoice-uuid-001');
    expect(result.dealId).toBe('deal-uuid-001');
  });
});
