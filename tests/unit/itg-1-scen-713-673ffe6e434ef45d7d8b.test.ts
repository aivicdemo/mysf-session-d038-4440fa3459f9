import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-713: 修正時に修正前値の一部だけが指定された場合、更新日時が更新される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存レコードを修正し、updatedAt を更新', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：既存の請求明細レコード、請求書、商談が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: '660e8400-e29b-41d4-a716-446655440001',
        invoiceId: '660e8400-e29b-41d4-a716-446655440001',
        dealId: '770e8400-e29b-41d4-a716-446655440002',
        customerId: '880e8400-e29b-41d4-a716-446655440003',
        salesPersonId: '990e8400-e29b-41d4-a716-446655440004',
        invoiceNumber: 'INV-2026-001',
        invoiceDate: '2026-10-01T00:00:00.000Z',
        dueDate: '2026-11-01T00:00:00.000Z',
        totalAmount: 165000,
        taxAmount: 15000,
        subtotalAmount: 150000,
        status: 'unpaid',
        paidDate: null,
        paidAmount: 0,
        remarks: null,
        createdAt: '2026-10-01T09:00:00.000Z',
        updatedAt: '2026-10-01T09:00:00.000Z',
        createdBy: 'user-100',
      }])
      .mockResolvedValueOnce([{
        id: '770e8400-e29b-41d4-a716-446655440002',
        dealId: '770e8400-e29b-41d4-a716-446655440002',
        customerId: '880e8400-e29b-41d4-a716-446655440003',
        salesPersonId: '990e8400-e29b-41d4-a716-446655440004',
        dealName: '◎◎プロジェクト',
        dealAmount: 150000,
        stage: 'won',
        expectedClosingDate: '2026-09-30T00:00:00.000Z',
        description: '大型コンサルティングプロジェクト',
        closingDate: '2026-09-30T00:00:00.000Z',
        lossReason: null,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-30T10:00:00.000Z',
        createdBy: 'user-100',
        invoiceSLADeadline: '2026-10-07T23:59:59.000Z',
        invoiceSLAOverdueFlag: false,
      }])
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceId: '660e8400-e29b-41d4-a716-446655440001',
        dealId: '770e8400-e29b-41d4-a716-446655440002',
        activityId: null,
        lineNumber: 1,
        productName: 'コンサルティングサービス',
        productDescription: null,
        quantity: 3,
        unitPrice: 50000,
        amount: 150000,
        taxRate: 10,
        taxAmount: 15000,
        taxIncludedAmount: 165000,
        remarks: null,
        modificationPreviousQuantity: null,
        modificationPreviousUnitPrice: null,
        modificationPreviousAmount: null,
        createdAt: '2026-10-01T09:00:00.000Z',
        updatedAt: '2026-10-01T09:00:00.000Z',
        createdBy: 'user-100',
      }])
      .mockResolvedValueOnce({
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceId: '660e8400-e29b-41d4-a716-446655440001',
        dealId: '770e8400-e29b-41d4-a716-446655440002',
        activityId: null,
        lineNumber: 1,
        productName: 'コンサルティングサービス',
        productDescription: null,
        quantity: 2,
        unitPrice: 50000,
        amount: 100000,
        taxRate: 10,
        taxAmount: 10000,
        taxIncludedAmount: 110000,
        remarks: null,
        modificationPreviousQuantity: 3,
        modificationPreviousUnitPrice: 50000,
        modificationPreviousAmount: 150000,
        createdAt: '2026-10-01T09:00:00.000Z',
        updatedAt: '2026-10-08T10:30:00.000Z',
        createdBy: 'user-100',
      }); // 更新後のレコード

    const input: SaveInvoiceLineItemInput = {
      lineItemId: '550e8400-e29b-41d4-a716-446655440000',
      invoiceId: '660e8400-e29b-41d4-a716-446655440001',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      activityId: null,
      lineNumber: 1,
      productName: 'コンサルティングサービス',
      productDescription: null,
      quantity: 2,
      unitPrice: 50000,
      amount: 100000,
      taxRate: 10,
      taxAmount: 10000,
      taxIncludedAmount: 110000,
      remarks: null,
      modificationPreviousQuantity: 3,
      modificationPreviousUnitPrice: 50000,
      modificationPreviousAmount: 150000,
      currentUserId: 'user-123',
      operationTimestamp: '2026-10-08T10:30:00.000Z',
    };

    const result = await saveInvoiceLineItem(input);

    expect(result.lineItemId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.quantity).toBe(2);
    expect(result.modificationPreviousQuantity).toBe(3);
    expect(result.updatedAt).toBe('2026-10-08T10:30:00.000Z');
    expect(result.createdAt).toBe('2026-10-01T09:00:00.000Z');
  });
});
