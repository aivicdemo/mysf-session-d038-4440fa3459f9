import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-648: retrieveDiscrepancyDetailsForConfirmation - 差異検出結果と詳細情報の取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDを指定して呼び出し、関連するすべてのデータを整形して返す', async () => {
    const discrepancyId = 'diff-2024-001';

    const mockDiscrepancyDetectionRecord = {
      id: 'uuid-001',
      差異ID: 'diff-2024-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額が一致していない',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-01-15T09:30:00Z',
      重大度: '高',
      原因分類: '税金計算誤り',
      許容範囲判定: '範囲外',
      判定日時: '2024-01-15T10:00:00Z',
      判定者: 'user-judge-001',
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    const mockLegacyInvoice = {
      id: 'id-legacy-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-2024-0001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '確定',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商品代金',
      作成日時: '2024-01-10T09:00:00Z',
      更新日時: '2024-01-10T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
    };

    const mockNewInvoice = {
      id: 'id-new-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'INV-2024-0001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 950000,
      税金額: 95000,
      ステータス: '確定',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商品代金',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
    };

    const mockCorrectionTracking = {
      id: 'correction-001',
      是正ID: 'corr-uuid-001',
      差異ID: 'diff-2024-001',
      是正方法: '税金計算修正',
      是正ステータス: '完了',
      是正実行者: 'user-exec-001',
      是正実行日時: '2024-01-15T14:30:00Z',
      是正前データ: '{"税金額": 95000}',
      是正後データ: '{"税金額": 100000}',
      検証結果: '成功',
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
    };

    const mockConfirmationHistory = {
      id: 'confirm-001',
      確認ID: 'conf-uuid-001',
      差異ID: 'diff-2024-001',
      確認ユーザーID: 'user-confirm-001',
      確認日時: '2024-01-15T15:00:00Z',
      確認内容: '税金計算誤りを確認。是正方法は妥当と判定',
      判定結果: '承認',
      createdAt: '2024-01-15T15:00:00Z',
      updatedAt: '2024-01-15T15:00:00Z',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyDetectionRecord])
      .mockResolvedValueOnce([mockLegacyInvoice])
      .mockResolvedValueOnce([mockNewInvoice])
      .mockResolvedValueOnce([mockCorrectionTracking])
      .mockResolvedValueOnce([mockConfirmationHistory]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection).toMatchObject({
      discrepancyId: 'diff-2024-001',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が一致していない',
      amountDifference: 50000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2024-01-15T09:30:00Z',
      severity: '高',
      causeClassification: '税金計算誤り',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2024-01-15T10:00:00Z',
      judgedByUserId: 'user-judge-001',
    });

    expect(result.legacySystemInvoice).toMatchObject({
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'INV-2024-0001',
      invoiceDate: '2024-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2024-02-10T00:00:00Z',
      remarks: '商品代金',
    });

    expect(result.newSystemInvoice).toMatchObject({
      invoiceId: 'new-inv-001',
      invoiceNumber: 'INV-2024-0001',
      invoiceDate: '2024-01-10T00:00:00Z',
      invoiceAmount: 950000,
      taxAmount: 95000,
      status: '確定',
      paymentDueDate: '2024-02-10T00:00:00Z',
      remarks: '商品代金',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      correctionId: 'corr-uuid-001',
      differenceId: 'diff-2024-001',
      correctionMethod: '税金計算修正',
      correctionStatus: '完了',
      correctionExecutorUserId: 'user-exec-001',
      correctionExecutionDateTime: '2024-01-15T14:30:00Z',
      dataBeforeCorrection: '{"税金額": 95000}',
      dataAfterCorrection: '{"税金額": 100000}',
      verificationResult: '成功',
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      confirmationId: 'conf-uuid-001',
      discrepancyId: 'diff-2024-001',
      confirmationUserId: 'user-confirm-001',
      confirmationDateTime: '2024-01-15T15:00:00Z',
      confirmationContent: '税金計算誤りを確認。是正方法は妥当と判定',
      judgmentResult: '承認',
    });
  });
});
