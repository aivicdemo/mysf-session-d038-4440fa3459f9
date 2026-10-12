import { saveInvoiceLineItem, InvoiceNotFound, SaveInvoiceLineItemInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-706: 請求書IDが存在しない場合のInvoiceNotFoundエラー', () => {
  let mockDataStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataStore = require('../../src/platform/data-store');
  });

  it('指定された請求書IDが請求書テーブルに存在しない場合、InvoiceNotFoundエラーを発生させる', async () => {
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
    const dealId = '660e8400-e29b-41d4-a716-446655440001';

    // 前提: 請求書テーブルから検索した結果は空（請求書が存在しない）
    mockDataStore.listRecords.mockResolvedValueOnce([]);

    // 前提: 商談テーブルから検索した結果は商談が存在
    const dealRecord = {
      id: dealId,
      '取引先ID': '770e8400-e29b-41d4-a716-446655440002',
      '営業担当者ID': '880e8400-e29b-41d4-a716-446655440003',
      '商談名': 'A社システム導入',
      '商談金額': 2000000,
      'ステージ': '契約',
      '成約予定日': '2025-01-31T23:59:59Z',
      '説明': 'A社向けシステム構築',
      '成約日': '2025-01-10T00:00:00Z',
      '失注理由': null,
      'createdAt': '2024-12-01T08:00:00Z',
      'updatedAt': '2025-01-10T10:00:00Z',
      '作成者ID': '880e8400-e29b-41d4-a716-446655440003',
      '請求生成SLA期限': '2025-01-25T23:59:59Z',
      '請求SLA超過フラグ': false,
    };
    mockDataStore.listRecords.mockResolvedValueOnce([dealRecord]);

    const input: SaveInvoiceLineItemInput = {
      lineItemId: null,
      invoiceId,
      dealId,
      activityId: null,
      lineNumber: 1,
      productName: 'システム構築サービス',
      productDescription: null,
      quantity: 100,
      unitPrice: 10000,
      amount: 1000000,
      taxRate: 10,
      taxAmount: 100000,
      taxIncludedAmount: 1100000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      currentUserId: 'user-001',
      operationTimestamp: '2025-01-15T10:30:00Z',
    };

    // saveInvoiceLineItem が InvoiceNotFound エラーを発生させることを確認
    await expect(saveInvoiceLineItem(input)).rejects.toThrow(InvoiceNotFound);
    await expect(saveInvoiceLineItem(input)).rejects.toThrow('請求書が見つかりません。請求書ID: 550e8400-e29b-41d4-a716-446655440000');

    // 請求明細は保存されないことを確認
    expect(mockDataStore.createRecord).not.toHaveBeenCalled();
  });
});
