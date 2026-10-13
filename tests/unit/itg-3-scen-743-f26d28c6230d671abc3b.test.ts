import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-743: 差異の金額規模が手動修正の閾値を超える場合、データ整合性スコアが70以上であれば「自動同期」が決定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差異が150000で是正方法が「自動同期」、検証結果が「成功」の場合、正常に詳細情報が返される', async () => {
    const discrepancyId = 'diff-20250101-001';

    const mockDiscrepancyData = {
      id: 'diff-20250101-001',
      差異ID: 'diff-20250101-001',
      旧システム請求書ID: 'legacy-inv-2024-0001',
      新システム請求書ID: 'new-inv-2024-0001',
      差異種類: '金額差異',
      差異内容: '請求金額が不一致',
      金額差異: 150000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-01T10:30:00Z',
      重大度: '高',
      原因分類: 'システム移行エラー',
      許容範囲判定: '超過',
      判定日時: '2025-01-01T10:35:00Z',
      判定者: 'user-judge-001',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-2024-0001',
      請求書ID: 'legacy-inv-2024-0001',
      ユーザーID: 'cust-001',
      請求書番号: 'LEGACY-2024-001',
      請求日: '2024-12-20T00:00:00Z',
      請求金額: 500000,
      税金額: 50000,
      ステータス: '確定',
      支払期限日: '2025-01-20T00:00:00Z',
      摘要: 'システム移行前請求',
      作成日時: '2024-12-20T09:00:00Z',
      更新日時: '2024-12-20T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
    };

    const mockNewInvoice = {
      id: 'new-inv-2024-0001',
      請求書ID: 'new-inv-2024-0001',
      請求書番号: 'NEW-2024-001',
      請求日: '2024-12-21T00:00:00Z',
      請求金額: 650000,
      税金額: 65000,
      ステータス: '確定',
      支払期限日: '2025-01-21T00:00:00Z',
      摘要: 'システム移行後請求',
    };

    const mockCorrectionTracking = {
      id: 'corr-001',
      是正ID: 'corr-001',
      差異ID: 'diff-20250101-001',
      是正方法: '自動同期',
      是正ステータス: '完了',
      是正実行者: 'system-auto',
      是正実行日時: '2025-01-01T11:00:00Z',
      是正前データ: '{"請求金額": 500000}',
      是正後データ: '{"請求金額": 650000}',
      検証結果: '成功',
    };

    const mockConfirmationHistory = {
      id: 'conf-001',
      確認ID: 'conf-001',
      差異ID: 'diff-20250101-001',
      確認ユーザーID: 'user-admin-001',
      確認日時: '2025-01-01T11:15:00Z',
      確認内容: '差異原因は移行時の計算ロジック差異。是正方法は新システム値に統一する。',
      判定結果: '承認',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyData]) // 差異検出結果テーブル
      .mockResolvedValueOnce([mockLegacyInvoice]) // 旧システム請求書テーブル
      .mockResolvedValueOnce([mockNewInvoice]) // 新システム請求書テーブル
      .mockResolvedValueOnce([mockCorrectionTracking]) // 是正追跡管理履歴
      .mockResolvedValueOnce([mockConfirmationHistory]); // 差異確認履歴

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-20250101-001');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.amountDifference).toBe(150000);
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(500000);
    expect(result.newSystemInvoice?.invoiceAmount).toBe(650000);
    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('自動同期');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');
    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
