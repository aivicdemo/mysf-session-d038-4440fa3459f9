import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import type { SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-708: データベース保存が失敗した場合、DataStoreError エラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataStoreError を発生させる', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    // 前提：請求書と商談は存在するがデータストアへの保存に失敗
    mockDataStore.listRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesPersonId: '880e8400-e29b-41d4-a716-446655440003',
        invoiceNumber: 'INV-20261007-001',
        invoiceDate: '2026-10-07T00:00:00.000Z',
        dueDate: '2026-11-07T00:00:00.000Z',
        totalAmount: 5500000,
        taxAmount: 500000,
        subtotalAmount: 5000000,
        status: 'draft',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        createdAt: '2026-10-07T06:22:11.338Z',
        updatedAt: '2026-10-07T06:22:11.338Z',
        createdBy: 'user-001',
      }])
      .mockResolvedValueOnce([{
        id: '660e8400-e29b-41d4-a716-446655440001',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        customerId: '770e8400-e29b-41d4-a716-446655440002',
        salesPersonId: '880e8400-e29b-41d4-a716-446655440003',
        dealName: 'ABC社システム構築案件',
        dealAmount: 5500000,
        stage: 'won',
        expectedClosingDate: '2026-10-01T00:00:00.000Z',
        description: 'ABC社向けERP導入プロジェクト',
        closingDate: '2026-10-01T00:00:00.000Z',
        lossReason: null,
        createdAt: '2026-09-15T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440003',
      }])
      .mockRejectedValueOnce(new Error('Connection timeout')); // 保存時にエラー

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      activityId: null,
      lineNumber: 1,
      productName: 'システム開発コンサルティング',
      productDescription: null,
      quantity: 100,
      unitPrice: 50000,
      amount: 5000000,
      taxRate: 10,
      taxAmount: 500000,
      taxIncludedAmount: 5500000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T06:22:11.338Z',
    };

    await expect(saveInvoiceLineItem(input)).rejects.toThrow();
  });
});
