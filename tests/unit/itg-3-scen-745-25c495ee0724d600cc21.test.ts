import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-745: 是正方法が決定された状態で、決定内容と実行者・実行予定日時・是正前データが是正追跡管理テーブルに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正ステータスが「decided」で、是正前データと実行予定日時が記録されている場合、正常に詳細情報が返される', async () => {
    const discrepancyId = 'diff-12345678-abcd-ef01-2345-6789abcdef01';

    const mockDiscrepancyData = {
      id: 'diff-12345678-abcd-ef01-2345-6789abcdef01',
      差異ID: 'diff-12345678-abcd-ef01-2345-6789abcdef01',
      旧システム請求書ID: 'legacy-inv-00001',
      新システム請求書ID: 'new-inv-00001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: 'high',
      原因分類: 'システム移行エラー',
      許容範囲判定: '外',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: 'user-judge-001',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-00001',
      請求書ID: 'legacy-inv-00001',
      ユーザーID: 'user-legacy-001',
      請求書番号: 'LEG-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'issued',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '旧システム請求書',
    };

    const mockNewInvoice = {
      id: 'new-inv-00001',
      請求書ID: 'new-inv-00001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 950000,
      税金額: 95000,
      ステータス: 'issued',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '新システム請求書',
    };

    const mockCorrectionTracking = {
      id: 'correct-87654321-dcba-10fe-5432-1fedcba98765',
      是正ID: 'correct-87654321-dcba-10fe-5432-1fedcba98765',
      差異ID: 'diff-12345678-abcd-ef01-2345-6789abcdef01',
      是正方法: 'manual_adjustment',
      是正ステータス: 'decided',
      是正実行者: 'user-executor-001',
      是正実行日時: '2026-01-16T09:00:00Z',
      是正前データ: '{"請求金額": 950000, "税金額": 95000}',
      是正後データ: null,
      検証結果: null,
    };

    const mockConfirmationHistory = {
      id: 'confirm-11111111-2222-3333-4444-555555555555',
      確認ID: 'confirm-11111111-2222-3333-4444-555555555555',
      差異ID: 'diff-12345678-abcd-ef01-2345-6789abcdef01',
      確認ユーザーID: 'user-reviewer-001',
      確認日時: '2026-01-15T14:30:00Z',
      確認内容: '重大度が高い差異を確認。是正方法を決定する必要がある。',
      判定結果: 'need_correction',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyData]) // 差異検出結果テーブル
      .mockResolvedValueOnce([mockLegacyInvoice]) // 旧システム請求書テーブル
      .mockResolvedValueOnce([mockNewInvoice]) // 新システム請求書テーブル
      .mockResolvedValueOnce([mockCorrectionTracking]) // 是正追跡管理履歴
      .mockResolvedValueOnce([mockConfirmationHistory]); // 差異確認履歴

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-12345678-abcd-ef01-2345-6789abcdef01');
    expect(result.discrepancyDetection.severity).toBe('high');
    expect(result.discrepancyDetection.amountDifference).toBe(50000);
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceAmount).toBe(950000);
    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('correct-87654321-dcba-10fe-5432-1fedcba98765');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('manual_adjustment');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('decided');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-executor-001');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2026-01-16T09:00:00Z');
    expect(result.correctionTrackingHistory[0].dataBeforeCorrection).toBe('{"請求金額": 950000, "税金額": 95000}');
    expect(result.correctionTrackingHistory[0].dataAfterCorrection).toBeNull();
    expect(result.correctionTrackingHistory[0].verificationResult).toBeNull();
    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-reviewer-001');
    expect(result.confirmationHistory[0].judgmentResult).toBe('need_correction');
  });
});
