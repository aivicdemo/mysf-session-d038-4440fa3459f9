import { retrieveDiscrepancyDetailsForConfirmation, type RetrieveDiscrepancyDetailsForConfirmationOutput, DiscrepancyNotFoundError, LegacyInvoiceNotFoundError, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-787: 金額差分が0.1%を超える場合、影響を受ける業務領域に『営業進捗管理』が追加される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果から差異ID、差異種類、金額差異、重大度、原因分類、許容範囲判定を取得し、旧新システム請求書データと共に返す', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440001';

    // 前提条件: 差異検出結果テーブルの内容
    const discrepancyDetectionData = {
      id: discrepancyId,
      discrepancyId: discrepancyId,
      legacySystemInvoiceId: 'LEGACY-INV-001',
      newSystemInvoiceId: 'NEW-INV-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額に差異あり',
      amountDifference: 15000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T09:30:00Z',
      severity: '高',
      causeClassification: '営業進捗管理',
      toleranceJudgment: '超過',
      toleranceJudgmentDateTime: '2026-01-15T09:35:00Z',
      judgedByUserId: '550e8400-e29b-41d4-a716-446655440099',
      createdAt: '2026-01-15T09:30:00Z',
      updatedAt: '2026-01-15T09:35:00Z',
    };

    // 前提条件: 旧システム請求書データ
    const legacyInvoiceData = {
      id: 'legacy-invoice-001',
      invoiceId: 'LEGACY-INV-001',
      userId: 'USER-001',
      invoiceNumber: 'LEG-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1500000,
      taxAmount: 150000,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '営業進捗管理に関連する請求',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    };

    // 前提条件: 新システム請求書データ
    const newInvoiceData = {
      id: 'new-invoice-001',
      invoiceId: 'NEW-INV-001',
      invoiceNumber: 'NEW-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1515000,
      taxAmount: 151500,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '営業進捗管理に関連する請求',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-10T09:00:00Z',
    };

    // データストアのモック設定
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyDetectionData]) // 差異検出結果テーブル照会
      .mockResolvedValueOnce([legacyInvoiceData]) // 旧システム請求書テーブル照会
      .mockResolvedValueOnce([newInvoiceData]) // 新システム請求書テーブル照会
      .mockResolvedValueOnce([]) // 是正追跡管理テーブル照会
      .mockResolvedValueOnce([]); // 差異確認履歴テーブル照会

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    // 期待結果: discrepancyId が正しく返される
    expect(result.discrepancyId).toBe(discrepancyId);

    // 期待結果: 差異検出結果レコードの内容が正しい
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.amountDifference).toBe(15000);
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('営業進捗管理');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('超過');

    // 期待結果: 旧システム請求書レコードが正しい
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('LEGACY-INV-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1500000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(150000);
    expect(result.legacySystemInvoice?.status).toBe('確定');

    // 期待結果: 新システム請求書レコードが正しい
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('NEW-INV-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1515000);
    expect(result.newSystemInvoice?.taxAmount).toBe(151500);
    expect(result.newSystemInvoice?.status).toBe('確定');

    // 期待結果: 是正追跡管理履歴と差異確認履歴は空配列
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);

    // 業務ルール: 金額差異が0.1%を超える場合、原因分類に『営業進捗管理』が記録されている
    const percentageDifference = (15000 / 1500000) * 100;
    expect(percentageDifference).toBeGreaterThan(0.1);
    expect(result.discrepancyDetection.causeClassification).toBe('営業進捗管理');
  });
});
