import { saveInvoice, InvalidInvoiceAmountError, DealNotFoundError, InvoiceReferenceIntegrityError, InvalidInvoiceStatusError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-690: 更新時にmodificationReasonが指定された値として保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正理由が保存されて返却される', async () => {
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
    const dealId = '660e8400-e29b-41d4-a716-446655440001';
    const customerId = '770e8400-e29b-41d4-a716-446655440002';
    const salesRepresentativeId = '880e8400-e29b-41d4-a716-446655440003';
    const invoiceNumber = 'INV-2025-00001';
    const invoiceDate = '2025-01-15T09:00:00Z';
    const dueDate = '2025-02-15T09:00:00Z';
    const invoiceAmount = 1100000;
    const taxAmount = 100000;
    const untaxedAmount = 1000000;
    const invoiceStatus = '請求済';
    const paidDate = null;
    const paidAmount = null;
    const remarks = '追加項目納品';
    const modificationReason = '税率誤り（8%→10%）による金額修正';
    const reissueCount = 1;
    const lastReissuedAt = '2025-01-14T15:30:00Z';
    const amountCalculationVerificationStatus = '検証済';
    const referenceIntegrityVerificationStatus = '検証済';
    const currentUserId = '880e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2025-01-15T10:00:00Z';
    const createdAt = '2025-01-10T14:00:00Z';

    // 既存請求書テーブルの状態を設定
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([
          {
            id: invoiceId,
            '請求書ID': invoiceId,
            '商談ID': dealId,
            '取引先ID': customerId,
            '営業担当者ID': salesRepresentativeId,
            '請求書番号': invoiceNumber,
            '請求日': invoiceDate,
            '支払期限日': dueDate,
            '請求金額': 1000000,
            '税額': 80000,
            '税抜金額': 920000,
            '請求ステータス': '部分請求',
            '入金日': null,
            '入金金額': null,
            '摘要': remarks,
            '作成日時': createdAt,
            '更新日時': '2025-01-14T15:30:00Z',
            '作成者': salesRepresentativeId,
            '修正前請求金額': 1000000,
            '修正理由': null,
            '再発行回数': 0,
            '最終再発行日時': null,
            '金額計算検証ステータス': amountCalculationVerificationStatus,
            '金額計算検証日時': '2025-01-14T16:00:00Z',
            '参照関係検証ステータス': referenceIntegrityVerificationStatus,
            'createdAt': createdAt,
            'updatedAt': '2025-01-14T15:30:00Z',
          },
        ]);
      }
      if (tableName === '請求明細') {
        return Promise.resolve([
          {
            id: '990e8400-e29b-41d4-a716-446655440010',
            '請求明細ID': '990e8400-e29b-41d4-a716-446655440010',
            '請求書ID': invoiceId,
            '商談ID': dealId,
            '営業活動ID': 'aa0e8400-e29b-41d4-a716-446655440011',
            '明細行番号': 1,
            '商品名': 'システム開発サービス',
            '商品説明': '業務管理システムの構築',
            '数量': 1,
            '単価': 1000000,
            '金額': 1000000,
            '税率': 10,
            '税額': 100000,
            '税込金額': 1100000,
            '摘要': null,
            '作成日時': createdAt,
            '更新日時': '2025-01-14T15:30:00Z',
            '作成者': salesRepresentativeId,
            '修正前数量': null,
            '修正前単価': null,
            '修正前金額': null,
            'createdAt': createdAt,
            'updatedAt': '2025-01-14T15:30:00Z',
          },
        ]);
      }
      if (tableName === '商談') {
        return Promise.resolve([
          {
            id: dealId,
            '商談ID': dealId,
            '取引先ID': customerId,
            '営業担当者ID': salesRepresentativeId,
            '商談名': 'システム構築プロジェクト',
            '商談金額': invoiceAmount,
            'ステージ': '成約',
            '成約予定日': invoiceDate,
            '説明': 'クラウドベース業務管理システム構築案件',
            '成約日': invoiceDate,
            '失注理由': null,
            '作成日時': '2025-01-01T10:00:00Z',
            '更新日時': invoiceDate,
            '作成者ID': salesRepresentativeId,
            '請求生成SLA期限': '2025-01-20T09:00:00Z',
            '請求SLA超過フラグ': false,
            'createdAt': '2025-01-01T10:00:00Z',
            'updatedAt': invoiceDate,
          },
        ]);
      }
      return Promise.resolve([]);
    });

    // updateRecord をモック
    (dataStore.updateRecord as jest.Mock).mockResolvedValue({
      id: invoiceId,
      '請求書ID': invoiceId,
      '商談ID': dealId,
      '取引先ID': customerId,
      '営業担当者ID': salesRepresentativeId,
      '請求書番号': invoiceNumber,
      '請求日': invoiceDate,
      '支払期限日': dueDate,
      '請求金額': invoiceAmount,
      '税額': taxAmount,
      '税抜金額': untaxedAmount,
      '請求ステータス': invoiceStatus,
      '入金日': paidDate,
      '入金金額': paidAmount,
      '摘要': remarks,
      '修正理由': modificationReason,
      '再発行回数': reissueCount,
      '最終再発行日時': lastReissuedAt,
      '金額計算検証ステータス': amountCalculationVerificationStatus,
      '参照関係検証ステータス': referenceIntegrityVerificationStatus,
      'createdAt': createdAt,
      'updatedAt': operationTimestamp,
      '作成者': salesRepresentativeId,
    });

    const input = {
      invoiceId,
      dealId,
      customerId,
      salesRepresentativeId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      invoiceAmount,
      taxAmount,
      untaxedAmount,
      invoiceStatus,
      paidDate,
      paidAmount,
      remarks,
      modificationReason,
      reissueCount,
      lastReissuedAt,
      amountCalculationVerificationStatus,
      referenceIntegrityVerificationStatus,
      currentUserId,
      operationTimestamp,
    };

    const result = await saveInvoice(input);

    expect(result.invoiceId).toBe(invoiceId);
    expect(result.dealId).toBe(dealId);
    expect(result.customerId).toBe(customerId);
    expect(result.salesRepresentativeId).toBe(salesRepresentativeId);
    expect(result.invoiceNumber).toBe(invoiceNumber);
    expect(result.invoiceDate).toBe(invoiceDate);
    expect(result.dueDate).toBe(dueDate);
    expect(result.invoiceAmount).toBe(invoiceAmount);
    expect(result.taxAmount).toBe(taxAmount);
    expect(result.untaxedAmount).toBe(untaxedAmount);
    expect(result.invoiceStatus).toBe(invoiceStatus);
    expect(result.paidDate).toBe(paidDate);
    expect(result.paidAmount).toBe(paidAmount);
    expect(result.remarks).toBe(remarks);
    expect(result.modificationReason).toBe(modificationReason);
    expect(result.reissueCount).toBe(reissueCount);
    expect(result.lastReissuedAt).toBe(lastReissuedAt);
    expect(result.amountCalculationVerificationStatus).toBe(amountCalculationVerificationStatus);
    expect(result.referenceIntegrityVerificationStatus).toBe(referenceIntegrityVerificationStatus);
    expect(result.createdAt).toBe(createdAt);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe(salesRepresentativeId);
  });
});
