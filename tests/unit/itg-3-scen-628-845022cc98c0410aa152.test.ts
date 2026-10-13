import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-628: 差異の種類と発生箇所を分析して原因カテゴリ別に分類し、対応優先度を判定できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異の種類・内容・原因分類・優先度を含む詳細情報を取得できる', async () => {
    const discrepancyId = 'diff-2024-001';

    const discrepancyDetectionRecord = {
      id: 'uuid-diff-001',
      差異ID: 'diff-2024-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額ズレ',
      差異内容: '請求金額の不一致。旧システム110000円に対し新システム100000円',
      金額差異: 10000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-10-15T09:30:00Z',
      重大度: 'high',
      原因分類: '端数処理相違',
      許容範囲判定: 'out_of_range',
      判定日時: '2024-10-15T10:15:00Z',
      判定者: 'user-judge-001',
      createdAt: '2024-10-15T09:30:00Z',
      updatedAt: '2024-10-15T10:15:00Z',
    };

    const legacyInvoiceRecord = {
      id: 'uuid-legacy-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-customer-001',
      請求書番号: 'LEG-2024-10-001',
      請求日: '2024-10-01T00:00:00Z',
      請求金額: 110000,
      税金額: 10000,
      ステータス: 'issued',
      支払期限日: '2024-10-31T23:59:59Z',
      摘要: 'システム移行対応分',
      作成日時: '2024-10-01T08:00:00Z',
      更新日時: '2024-10-01T08:00:00Z',
      検証ステータス: 'pending',
      検証日時: null,
      createdAt: '2024-10-01T08:00:00Z',
      updatedAt: '2024-10-01T08:00:00Z',
    };

    const newInvoiceRecord = {
      id: 'uuid-new-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2024-10-001',
      請求日: '2024-10-05T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: 'issued',
      支払期限日: '2024-11-04T23:59:59Z',
      摘要: 'システム移行対応分',
      createdAt: '2024-10-05T09:00:00Z',
      updatedAt: '2024-10-05T09:00:00Z',
    };

    const correctionRecord = {
      id: 'uuid-correction-001',
      是正ID: 'corr-2024-001',
      差異ID: 'diff-2024-001',
      是正方法: 'manual_adjustment',
      是正ステータス: 'completed',
      是正実行者: 'user-corrector-001',
      是正実行日時: '2024-10-16T14:00:00Z',
      是正前データ: '{"amount": 110000}',
      是正後データ: '{"amount": 100000}',
      検証結果: 'success',
      createdAt: '2024-10-16T14:00:00Z',
      updatedAt: '2024-10-16T14:00:00Z',
    };

    const confirmationRecord = {
      id: 'uuid-confirm-001',
      確認ID: 'conf-2024-001',
      差異ID: 'diff-2024-001',
      確認ユーザーID: 'user-approver-001',
      確認日時: '2024-10-17T11:30:00Z',
      確認内容: '端数処理相違による金額ズレ。新システムの計算ロジックが正であることを確認。是正完了。',
      判定結果: 'confirmed',
      createdAt: '2024-10-17T11:30:00Z',
      updatedAt: '2024-10-17T11:30:00Z',
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

    expect(result.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額ズレ');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額の不一致。旧システム110000円に対し新システム100000円');
    expect(result.discrepancyDetection.amountDifference).toBe(10000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2024-10-15T09:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('high');
    expect(result.discrepancyDetection.causeClassification).toBe('端数処理相違');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('out_of_range');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2024-10-15T10:15:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('user-judge-001');

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2024-10-001');
    expect(result.legacySystemInvoice?.invoiceDate).toBe('2024-10-01T00:00:00Z');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(110000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(10000);
    expect(result.legacySystemInvoice?.status).toBe('issued');
    expect(result.legacySystemInvoice?.paymentDueDate).toBe('2024-10-31T23:59:59Z');
    expect(result.legacySystemInvoice?.remarks).toBe('システム移行対応分');

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2024-10-001');
    expect(result.newSystemInvoice?.invoiceDate).toBe('2024-10-05T00:00:00Z');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(100000);
    expect(result.newSystemInvoice?.taxAmount).toBe(10000);
    expect(result.newSystemInvoice?.status).toBe('issued');
    expect(result.newSystemInvoice?.paymentDueDate).toBe('2024-11-04T23:59:59Z');
    expect(result.newSystemInvoice?.remarks).toBe('システム移行対応分');

    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-2024-001');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('manual_adjustment');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('completed');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-corrector-001');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2024-10-16T14:00:00Z');
    expect(result.correctionTrackingHistory[0].dataBeforeCorrection).toBe('{"amount": 110000}');
    expect(result.correctionTrackingHistory[0].dataAfterCorrection).toBe('{"amount": 100000}');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('success');

    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('conf-2024-001');
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-approver-001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-10-17T11:30:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('端数処理相違による金額ズレ。新システムの計算ロジックが正であることを確認。是正完了。');
    expect(result.confirmationHistory[0].judgmentResult).toBe('confirmed');
  });
});
