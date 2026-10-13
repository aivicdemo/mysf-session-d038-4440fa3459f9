import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-626: 原因分類対象に確定した差異について、旧システムと新システムの対応する請求書データを並行取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('並行取得した旧新両システムの請求書データから差異の発生箇所と内容を把握できる', async () => {
    const discrepancyId = 'diff-20250107-001';

    const discrepancyDetectionRecord = {
      差異ID: 'diff-20250107-001',
      旧システム請求書ID: 'legacy-inv-20250101-500',
      新システム請求書ID: 'new-inv-20250101-500',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-07T10:30:00Z',
      重大度: 'HIGH',
      原因分類: '税計算ロジック差異',
      許容範囲判定: 'OUT_OF_RANGE',
      判定日時: '2025-01-07T11:00:00Z',
      判定者: 'user-judge-001',
      id: 'diff-20250107-001',
    };

    const legacyInvoiceRecord = {
      請求書ID: 'legacy-inv-20250101-500',
      ユーザーID: 'cust-legacy-500',
      請求書番号: 'LEG-2025-0001',
      請求日: '2025-01-01T00:00:00Z',
      請求金額: 110000,
      税金額: 10000,
      ステータス: 'ISSUED',
      支払期限日: '2025-02-01T00:00:00Z',
      摘要: '商品A、商品B販売',
      id: 'legacy-inv-20250101-500',
    };

    const newInvoiceRecord = {
      請求書ID: 'new-inv-20250101-500',
      請求書番号: 'NEW-2025-0001',
      請求日: '2025-01-01T00:00:00Z',
      請求金額: 105000,
      税金額: 5000,
      ステータス: 'ISSUED',
      支払期限日: '2025-02-01T00:00:00Z',
      摘要: '商品A、商品B販売',
      id: 'new-inv-20250101-500',
    };

    const correctionRecord = {
      是正ID: 'corr-diff-20250107-001-001',
      差異ID: 'diff-20250107-001',
      是正方法: 'TAX_RECALCULATION',
      是正ステータス: 'COMPLETED',
      是正実行者: 'user-corrector-001',
      是正実行日時: '2025-01-07T14:00:00Z',
      是正前データ: '{"tax": 10000}',
      是正後データ: '{"tax": 5000}',
      検証結果: 'VERIFIED',
      id: 'corr-diff-20250107-001-001',
    };

    const confirmationRecord = {
      確認ID: 'conf-diff-20250107-001-001',
      差異ID: 'diff-20250107-001',
      確認ユーザーID: 'user-reviewer-001',
      確認日時: '2025-01-07T15:30:00Z',
      確認内容: '旧システムの税計算ロジックが新システムと異なることを確認。新システムの計算が正しい。',
      判定結果: 'CONFIRMED',
      id: 'conf-diff-20250107-001-001',
    };

    const mockListRecords = jest.fn();
    (dataStore.listRecords as jest.Mock) = mockListRecords;

    mockListRecords.mockResolvedValueOnce([discrepancyDetectionRecord]);
    mockListRecords.mockResolvedValueOnce([legacyInvoiceRecord]);
    mockListRecords.mockResolvedValueOnce([newInvoiceRecord]);
    mockListRecords.mockResolvedValueOnce([correctionRecord]);
    mockListRecords.mockResolvedValueOnce([confirmationRecord]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe('diff-20250107-001');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-20250107-001');
    expect(result.discrepancyDetection.legacySystemInvoiceId).toBe('legacy-inv-20250101-500');
    expect(result.discrepancyDetection.newSystemInvoiceId).toBe('new-inv-20250101-500');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額が異なる');
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2025-01-07T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('HIGH');
    expect(result.discrepancyDetection.causeClassification).toBe('税計算ロジック差異');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('OUT_OF_RANGE');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2025-01-07T11:00:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('user-judge-001');

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-20250101-500');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2025-0001');
    expect(result.legacySystemInvoice?.invoiceDate).toBe('2025-01-01T00:00:00Z');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(110000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(10000);
    expect(result.legacySystemInvoice?.status).toBe('ISSUED');
    expect(result.legacySystemInvoice?.paymentDueDate).toBe('2025-02-01T00:00:00Z');
    expect(result.legacySystemInvoice?.remarks).toBe('商品A、商品B販売');

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-20250101-500');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2025-0001');
    expect(result.newSystemInvoice?.invoiceDate).toBe('2025-01-01T00:00:00Z');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(105000);
    expect(result.newSystemInvoice?.taxAmount).toBe(5000);
    expect(result.newSystemInvoice?.status).toBe('ISSUED');
    expect(result.newSystemInvoice?.paymentDueDate).toBe('2025-02-01T00:00:00Z');
    expect(result.newSystemInvoice?.remarks).toBe('商品A、商品B販売');

    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-diff-20250107-001-001');
    expect(result.correctionTrackingHistory[0].differenceId).toBe('diff-20250107-001');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('TAX_RECALCULATION');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('COMPLETED');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-corrector-001');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2025-01-07T14:00:00Z');
    expect(result.correctionTrackingHistory[0].dataBeforeCorrection).toBe('{"tax": 10000}');
    expect(result.correctionTrackingHistory[0].dataAfterCorrection).toBe('{"tax": 5000}');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('VERIFIED');

    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('conf-diff-20250107-001-001');
    expect(result.confirmationHistory[0].discrepancyId).toBe('diff-20250107-001');
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-reviewer-001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2025-01-07T15:30:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('旧システムの税計算ロジックが新システムと異なることを確認。新システムの計算が正しい。');
    expect(result.confirmationHistory[0].judgmentResult).toBe('CONFIRMED');
  });
});
