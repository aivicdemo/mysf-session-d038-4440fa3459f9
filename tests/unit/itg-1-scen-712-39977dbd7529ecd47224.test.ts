import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-712: 修正前フィールドが省略された場合、null のまま保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正前フィールドが全て null のまま保存される', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：請求書と商談が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: 'inv-uuid-001',
        invoiceId: 'inv-uuid-001',
        dealId: 'deal-uuid-001',
        customerId: 'client-uuid-001',
        salesPersonId: 'user-uuid-001',
        invoiceNumber: 'INV-2025-001',
        invoiceDate: '2025-01-15T00:00:00.000Z',
        dueDate: '2025-02-15T00:00:00.000Z',
        totalAmount: 550000,
        taxAmount: 50000,
        subtotalAmount: 500000,
        status: 'draft',
        paidDate: null,
        paidAmount: 0,
        remarks: null,
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        createdBy: 'user-uuid-001',
        modificationPreviousAmount: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissueDate: null,
        amountCalculationValidationStatus: 'pending',
        amountCalculationValidationDate: null,
        referenceValidationStatus: 'pending',
      }])
      .mockResolvedValueOnce([{
        id: 'deal-uuid-001',
        dealId: 'deal-uuid-001',
        customerId: 'client-uuid-001',
        salesPersonId: 'user-uuid-001',
        dealName: 'A社クラウド導入',
        dealAmount: 550000,
        stage: 'won',
        expectedClosingDate: '2025-01-15T00:00:00.000Z',
        description: 'クラウドコンサルティング契約',
        closingDate: '2025-01-15T00:00:00.000Z',
        lossReason: null,
        createdAt: '2025-01-10T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        createdBy: 'user-uuid-001',
        invoiceSLADeadline: '2025-01-20T00:00:00.000Z',
        invoiceSLAOverdueFlag: false,
      }])
      .mockResolvedValueOnce([]) // 請求明細テーブルは空
      .mockResolvedValueOnce({
        id: 'new-uuid-line-001',
        invoiceId: 'inv-uuid-001',
        dealId: 'deal-uuid-001',
        activityId: null,
        lineNumber: 1,
        productName: 'クラウドコンサルティング',
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
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
        createdBy: 'user-uuid-001',
      }); // 保存後のレコード

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId: 'inv-uuid-001',
      dealId: 'deal-uuid-001',
      activityId: null,
      lineNumber: 1,
      productName: 'クラウドコンサルティング',
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
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2025-01-15T10:30:00.000Z',
    };

    const result = await saveInvoiceLineItem(input);

    expect(result.modificationPreviousQuantity).toBeNull();
    expect(result.modificationPreviousUnitPrice).toBeNull();
    expect(result.modificationPreviousAmount).toBeNull();
  });
});
