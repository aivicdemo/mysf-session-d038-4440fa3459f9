import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-707: 金額が計算値と一致しない場合、InvalidLineItemAmount エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('amount が計算値と一致しない場合、エラーを発生させる', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：請求書と商談が存在
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: 'invoice-001',
        invoiceId: 'invoice-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesPersonId: 'user-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15T00:00:00Z',
        dueDate: '2024-02-15T00:00:00Z',
        totalAmount: 110000,
        taxAmount: 10000,
        subtotalAmount: 100000,
        status: 'draft',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        modificationPreviousAmount: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissueDate: null,
        amountCalculationValidationStatus: 'pending',
        amountCalculationValidationDate: null,
        referenceValidationStatus: 'pending',
      }])
      .mockResolvedValueOnce([{
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesPersonId: 'user-001',
        dealName: 'テスト商談',
        dealAmount: 100000,
        stage: 'negotiation',
        expectedClosingDate: '2024-02-28T00:00:00Z',
        description: 'テスト用商談',
        closingDate: null,
        lossReason: null,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'user-001',
        invoiceSLADeadline: '2024-02-10T00:00:00Z',
        invoiceSLAOverdueFlag: false,
      }])
      .mockResolvedValueOnce([]); // 請求明細テーブルは空

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId: 'invoice-001',
      dealId: 'deal-001',
      activityId: null,
      lineNumber: 1,
      productName: 'テスト商品',
      productDescription: null,
      quantity: 100,
      unitPrice: 1000,
      amount: 150000,
      taxRate: 10,
      taxAmount: 15000,
      taxIncludedAmount: 165000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      currentUserId: 'user-001',
      operationTimestamp: '2024-01-15T11:30:00Z',
    };

    await expect(saveInvoiceLineItem(input)).rejects.toThrow(/明細行の金額が計算値と一致しません/);
  });
});
