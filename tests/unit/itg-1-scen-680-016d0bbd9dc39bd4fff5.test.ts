import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoice } from '../../src/logic/data-persistence';
import type { SaveInvoiceInput, SaveInvoiceOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-680: 既存請求書を正常に更新して、更新後のレコードが返される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update an existing invoice and return the updated record', async () => {
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
    const dealId = '660e8400-e29b-41d4-a716-446655440001';
    const customerId = '770e8400-e29b-41d4-a716-446655440002';
    const salesRepresentativeId = '880e8400-e29b-41d4-a716-446655440003';
    const currentUserId = '990e8400-e29b-41d4-a716-446655440004';
    const operationTimestamp = '2025-01-15T14:00:00Z';

    const existingInvoice = {
      id: invoiceId,
      '請求書ID': invoiceId,
      '商談ID': dealId,
      '取引先ID': customerId,
      '営業担当者ID': salesRepresentativeId,
      '請求書番号': 'INV-2025-00122',
      '請求日': '2025-01-15T00:00:00Z',
      '支払期限日': '2025-02-15T00:00:00Z',
      '請求金額': 100000,
      '税額': 9000,
      '税抜金額': 91000,
      '請求ステータス': '未請求',
      '入金日': null,
      '入金金額': null,
      '摘要': '初版',
      '作成日時': '2025-01-01T08:00:00Z',
      '更新日時': '2025-01-01T08:00:00Z',
      '作成者': salesRepresentativeId,
      '修正前請求金額': null,
      '修正理由': null,
      '再発行回数': 0,
      '最終再発行日時': null,
      '金額計算検証ステータス': '検証待ち',
      '金額計算検証日時': null,
      '参照関係検証ステータス': '検証待ち',
    };

    const lineItems = [
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440010',
        '請求明細ID': 'aa0e8400-e29b-41d4-a716-446655440010',
        '請求書ID': invoiceId,
        '商談ID': dealId,
        '営業活動ID': 'bb0e8400-e29b-41d4-a716-446655440011',
        '明細行番号': 1,
        '商品名': 'システム開発サービス',
        '商品説明': 'Webアプリケーション開発',
        '数量': 100,
        '単価': 1000,
        '金額': 100000,
        '税率': 10,
        '税額': 10000,
        '税込金額': 110000,
        '摘要': null,
        '作成日時': '2025-01-01T08:00:00Z',
        '更新日時': '2025-01-01T08:00:00Z',
        '作成者': salesRepresentativeId,
        '修正前数量': null,
        '修正前単価': null,
        '修正前金額': null,
      },
    ];

    const deal = {
      id: dealId,
      '商談ID': dealId,
      '取引先ID': customerId,
      '営業担当者ID': salesRepresentativeId,
      '商談名': 'A社2025年システム提供案件',
      '商談金額': 110000,
      ステージ: '成約',
      '成約予定日': '2025-01-15T00:00:00Z',
      '説明': 'Webアプリケーション開発',
      '成約日': '2025-01-15T00:00:00Z',
      '失注理由': null,
      '作成日時': '2024-12-01T08:00:00Z',
      '更新日時': '2025-01-15T08:00:00Z',
      '作成者ID': salesRepresentativeId,
      '請求生成SLA期限': '2025-01-20T00:00:00Z',
      '請求SLA超過フラグ': false,
    };

    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([existingInvoice]);
      }
      if (tableName === '請求明細') {
        return Promise.resolve(lineItems);
      }
      if (tableName === '商談') {
        return Promise.resolve([deal]);
      }
      return Promise.resolve([]);
    });

    mockDataStore.updateRecord.mockResolvedValue(undefined);

    const input: SaveInvoiceInput = {
      invoiceId,
      dealId,
      customerId,
      salesRepresentativeId,
      invoiceNumber: 'INV-2025-00123',
      invoiceDate: '2025-01-15T00:00:00Z',
      dueDate: '2025-02-15T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '請求済',
      paidDate: '2025-01-20T10:30:00Z',
      paidAmount: 110000,
      remarks: '第1四半期分請求',
      modificationReason: '消費税率の修正に伴う再計算',
      reissueCount: 1,
      lastReissuedAt: '2025-01-10T09:00:00Z',
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId,
      operationTimestamp,
    };

    const result: SaveInvoiceOutput = await saveInvoice(input);

    expect(result).toBeDefined();
    expect(result.invoiceId).toBe(invoiceId);
    expect(result.dealId).toBe(dealId);
    expect(result.customerId).toBe(customerId);
    expect(result.salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.invoiceNumber).toBe('INV-2025-00123');
    expect(result.invoiceDate).toBe('2025-01-15T00:00:00Z');
    expect(result.dueDate).toBe('2025-02-15T00:00:00Z');
    expect(result.invoiceAmount).toBe(110000);
    expect(result.taxAmount).toBe(10000);
    expect(result.untaxedAmount).toBe(100000);
    expect(result.invoiceStatus).toBe('請求済');
    expect(result.paidDate).toBe('2025-01-20T10:30:00Z');
    expect(result.paidAmount).toBe(110000);
    expect(result.remarks).toBe('第1四半期分請求');
    expect(result.modificationReason).toBe('消費税率の修正に伴う再計算');
    expect(result.reissueCount).toBe(1);
    expect(result.lastReissuedAt).toBe('2025-01-10T09:00:00Z');
    expect(result.amountCalculationVerificationStatus).toBe('検証済');
    expect(result.referenceIntegrityVerificationStatus).toBe('検証済');
    expect(result.createdAt).toBe('2025-01-01T08:00:00Z');
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(salesRepresentativeId);

    expect(mockDataStore.updateRecord).toHaveBeenCalled();
  });
});
