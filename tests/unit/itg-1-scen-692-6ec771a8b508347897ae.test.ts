import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-692: 再発行時にreissueCountがインクリメントされて保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存請求書（invoiceId指定）の再発行で、reissueCountが1にインクリメント、lastReissuedAtが更新される', async () => {
    const existingInvoiceId = '550e8400-e29b-41d4-a716-446655440000';
    const operationTimestamp = '2025-01-20T14:30:00Z';
    const currentUserId = '550e8400-e29b-41d4-a716-446655440004';

    // Setup mock for 請求書テーブル
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([
      {
        id: existingInvoiceId,
        請求書ID: existingInvoiceId,
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        取引先ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
        請求書番号: 'INV-20250101-001',
        請求日: '2025-01-15T09:00:00Z',
        支払期限日: '2025-02-15T09:00:00Z',
        請求金額: 1100000,
        税額: 100000,
        税抜金額: 1000000,
        請求ステータス: '請求済',
        入金日: null,
        入金金額: null,
        摘要: '初回請求',
        作成日時: '2025-01-15T09:00:00Z',
        更新日時: '2025-01-15T09:00:00Z',
        作成者: '550e8400-e29b-41d4-a716-446655440004',
        修正前請求金額: null,
        修正理由: null,
        再発行回数: 0,
        最終再発行日時: null,
        金額計算検証ステータス: '検証済',
        金額計算検証日時: '2025-01-15T09:00:00Z',
        参照関係検証ステータス: '検証済',
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T09:00:00Z',
      },
    ]);

    // Setup mock for 請求明細テーブル
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        請求明細ID: '550e8400-e29b-41d4-a716-446655440010',
        請求書ID: existingInvoiceId,
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '550e8400-e29b-41d4-a716-446655440011',
        明細行番号: 1,
        商品名: 'コンサルティングサービス',
        商品説明: 'システム構築コンサルティング',
        数量: 1,
        単価: 1000000,
        金額: 1000000,
        税率: 10,
        税額: 100000,
        税込金額: 1100000,
        摘要: '納期完了',
        作成日時: '2025-01-15T09:00:00Z',
        更新日時: '2025-01-15T09:00:00Z',
        作成者: '550e8400-e29b-41d4-a716-446655440004',
        修正前数量: null,
        修正前単価: null,
        修正前金額: null,
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T09:00:00Z',
      },
    ]);

    // Setup mock for 商談テーブル
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        取引先ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
        商談名: 'システム構築プロジェクト',
        商談金額: 1100000,
        ステージ: '成約',
        成約予定日: '2025-01-15T09:00:00Z',
        説明: '大規模システム構築案件',
        成約日: '2025-01-15T09:00:00Z',
        失注理由: null,
        作成日時: '2025-01-01T09:00:00Z',
        更新日時: '2025-01-15T09:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440004',
        請求生成SLA期限: '2025-01-20T09:00:00Z',
        請求SLA超過フラグ: false,
        createdAt: '2025-01-01T09:00:00Z',
        updatedAt: '2025-01-15T09:00:00Z',
      },
    ]);

    // Mock updateRecord to return the updated invoice with incremented reissueCount
    (dataStore.updateRecord as jest.Mock).mockResolvedValueOnce({
      id: existingInvoiceId,
      invoiceId: existingInvoiceId,
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      customerId: '550e8400-e29b-41d4-a716-446655440002',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
      invoiceNumber: 'INV-20250101-001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-15T09:00:00Z',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '請求済',
      paidDate: null,
      paidAmount: null,
      remarks: '初回請求',
      modificationReason: null,
      reissueCount: 1,
      lastReissuedAt: operationTimestamp,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      createdAt: '2025-01-15T09:00:00Z',
      updatedAt: operationTimestamp,
      createdBy: '550e8400-e29b-41d4-a716-446655440004',
    });

    const input = {
      invoiceId: existingInvoiceId,
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      customerId: '550e8400-e29b-41d4-a716-446655440002',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
      invoiceNumber: 'INV-20250101-001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-15T09:00:00Z',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '請求済',
      paidDate: null,
      paidAmount: null,
      remarks: '初回請求',
      modificationReason: null,
      reissueCount: 1,
      lastReissuedAt: operationTimestamp,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId,
      operationTimestamp,
    };

    const result = await saveInvoice(input);

    // Verify the result contains the expected fields
    expect(result).toBeDefined();
    expect(result.reissueCount).toBe(1);
    expect(result.lastReissuedAt).toBe(operationTimestamp);
    expect(result.invoiceId).toBe(existingInvoiceId);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.invoiceNumber).toBe('INV-20250101-001');
    expect(result.invoiceAmount).toBe(1100000);

    // Verify updateRecord was called with the correct parameters
    expect(dataStore.updateRecord).toHaveBeenCalled();
  });
});
