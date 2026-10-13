import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-629: 差異原因分類と優先度判定の操作履歴を記録して、誰がいつどの差異をどのように分類・判定したかを追跡可能にできる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の是正追跡管理履歴と差異確認履歴が時系列で取得できる', async () => {
    const discrepancyId = 'disc-uuid-001';

    const discrepancyDetectionRecord = {
      差異ID: 'disc-uuid-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額相違',
      差異内容: '消費税計算ロジック差異',
      金額差異: 15000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'システムロジック差異',
      許容範囲判定: '範囲外',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: 'user-uuid-001',
      id: 'rec-001',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T11:00:00Z',
    };

    const legacyInvoiceRecord = {
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-legacy-001',
      請求書番号: 'LEG-20260115-001',
      請求日: '2026-01-15T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '確定済み',
      支払期限日: '2026-02-15T00:00:00Z',
      摘要: '2026年1月度請求',
      作成日時: '2026-01-15T09:00:00Z',
      更新日時: '2026-01-15T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
      id: 'legacy-rec-001',
      createdAt: '2026-01-15T09:00:00Z',
      updatedAt: '2026-01-15T09:00:00Z',
    };

    const newInvoiceRecord = {
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-20260115-001',
      請求日: '2026-01-15T00:00:00Z',
      請求金額: 1015000,
      税金額: 115000,
      ステータス: '確定済み',
      支払期限日: '2026-02-15T00:00:00Z',
      摘要: '2026年1月度請求',
      id: 'new-rec-001',
      createdAt: '2026-01-15T09:30:00Z',
      updatedAt: '2026-01-15T09:30:00Z',
    };

    const correctionRecord1 = {
      是正ID: 'corr-uuid-001',
      差異ID: 'disc-uuid-001',
      是正方法: '新システムロジック修正',
      是正ステータス: '完了',
      是正実行者: 'user-uuid-002',
      是正実行日時: '2026-01-16T14:30:00Z',
      是正前データ: '{"taxRate":8}',
      是正後データ: '{"taxRate":10}',
      検証結果: '成功',
      id: 'corr-rec-001',
      createdAt: '2026-01-16T14:30:00Z',
      updatedAt: '2026-01-16T14:30:00Z',
    };

    const correctionRecord2 = {
      是正ID: 'corr-uuid-002',
      差異ID: 'disc-uuid-001',
      是正方法: 'データ再計算',
      是正ステータス: '完了',
      是正実行者: 'user-uuid-003',
      是正実行日時: '2026-01-17T09:15:00Z',
      是正前データ: '{"amount":1000000}',
      是正後データ: '{"amount":1015000}',
      検証結果: '成功',
      id: 'corr-rec-002',
      createdAt: '2026-01-17T09:15:00Z',
      updatedAt: '2026-01-17T09:15:00Z',
    };

    const confirmationRecord1 = {
      確認ID: 'conf-uuid-001',
      差異ID: 'disc-uuid-001',
      確認ユーザーID: 'user-uuid-004',
      確認日時: '2026-01-15T13:45:00Z',
      確認内容: '消費税計算ロジックの差異を確認。旧システムでは8%、新システムでは10%で計算されている。',
      判定結果: '原因特定',
      id: 'conf-rec-001',
      createdAt: '2026-01-15T13:45:00Z',
      updatedAt: '2026-01-15T13:45:00Z',
    };

    const confirmationRecord2 = {
      確認ID: 'conf-uuid-002',
      差異ID: 'disc-uuid-001',
      確認ユーザーID: 'user-uuid-005',
      確認日時: '2026-01-16T16:20:00Z',
      確認内容: 'システムロジック修正の検証。新システム側のロジック修正が正常に適用されたことを確認。',
      判定結果: '是正確認',
      id: 'conf-rec-002',
      createdAt: '2026-01-16T16:20:00Z',
      updatedAt: '2026-01-16T16:20:00Z',
    };

    const mockListRecords = jest.fn();
    (dataStore.listRecords as jest.Mock) = mockListRecords;

    mockListRecords.mockResolvedValueOnce([discrepancyDetectionRecord]);
    mockListRecords.mockResolvedValueOnce([legacyInvoiceRecord]);
    mockListRecords.mockResolvedValueOnce([newInvoiceRecord]);
    mockListRecords.mockResolvedValueOnce([correctionRecord1, correctionRecord2]);
    mockListRecords.mockResolvedValueOnce([confirmationRecord1, confirmationRecord2]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe('disc-uuid-001');

    expect(result.discrepancyDetection.discrepancyId).toBe('disc-uuid-001');
    expect(result.discrepancyDetection.legacySystemInvoiceId).toBe('legacy-inv-001');
    expect(result.discrepancyDetection.newSystemInvoiceId).toBe('new-inv-001');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額相違');
    expect(result.discrepancyDetection.discrepancyContent).toBe('消費税計算ロジック差異');
    expect(result.discrepancyDetection.amountDifference).toBe(15000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2026-01-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('システムロジック差異');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('範囲外');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2026-01-15T11:00:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('user-uuid-001');

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-20260115-001');
    expect(result.legacySystemInvoice?.invoiceDate).toBe('2026-01-15T00:00:00Z');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(100000);
    expect(result.legacySystemInvoice?.status).toBe('確定済み');
    expect(result.legacySystemInvoice?.paymentDueDate).toBe('2026-02-15T00:00:00Z');
    expect(result.legacySystemInvoice?.remarks).toBe('2026年1月度請求');

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-20260115-001');
    expect(result.newSystemInvoice?.invoiceDate).toBe('2026-01-15T00:00:00Z');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1015000);
    expect(result.newSystemInvoice?.taxAmount).toBe(115000);
    expect(result.newSystemInvoice?.status).toBe('確定済み');
    expect(result.newSystemInvoice?.paymentDueDate).toBe('2026-02-15T00:00:00Z');
    expect(result.newSystemInvoice?.remarks).toBe('2026年1月度請求');

    expect(result.correctionTrackingHistory.length).toBe(2);

    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-uuid-001');
    expect(result.correctionTrackingHistory[0].differenceId).toBe('disc-uuid-001');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('新システムロジック修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-uuid-002');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2026-01-16T14:30:00Z');
    expect(result.correctionTrackingHistory[0].dataBeforeCorrection).toBe('{"taxRate":8}');
    expect(result.correctionTrackingHistory[0].dataAfterCorrection).toBe('{"taxRate":10}');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.correctionTrackingHistory[1].correctionId).toBe('corr-uuid-002');
    expect(result.correctionTrackingHistory[1].differenceId).toBe('disc-uuid-001');
    expect(result.correctionTrackingHistory[1].correctionMethod).toBe('データ再計算');
    expect(result.correctionTrackingHistory[1].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[1].correctionExecutorUserId).toBe('user-uuid-003');
    expect(result.correctionTrackingHistory[1].correctionExecutionDateTime).toBe('2026-01-17T09:15:00Z');
    expect(result.correctionTrackingHistory[1].dataBeforeCorrection).toBe('{"amount":1000000}');
    expect(result.correctionTrackingHistory[1].dataAfterCorrection).toBe('{"amount":1015000}');
    expect(result.correctionTrackingHistory[1].verificationResult).toBe('成功');

    expect(result.confirmationHistory.length).toBe(2);

    expect(result.confirmationHistory[0].confirmationId).toBe('conf-uuid-001');
    expect(result.confirmationHistory[0].discrepancyId).toBe('disc-uuid-001');
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-uuid-004');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2026-01-15T13:45:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('消費税計算ロジックの差異を確認。旧システムでは8%、新システムでは10%で計算されている。');
    expect(result.confirmationHistory[0].judgmentResult).toBe('原因特定');

    expect(result.confirmationHistory[1].confirmationId).toBe('conf-uuid-002');
    expect(result.confirmationHistory[1].discrepancyId).toBe('disc-uuid-001');
    expect(result.confirmationHistory[1].confirmationUserId).toBe('user-uuid-005');
    expect(result.confirmationHistory[1].confirmationDateTime).toBe('2026-01-16T16:20:00Z');
    expect(result.confirmationHistory[1].confirmationContent).toBe('システムロジック修正の検証。新システム側のロジック修正が正常に適用されたことを確認。');
    expect(result.confirmationHistory[1].judgmentResult).toBe('是正確認');
  });
});
