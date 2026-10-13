import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-744: 差異の金額規模が手動修正の閾値を超え、データ整合性スコアが70未満の場合、「ロールバック」が検討される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差異が250000で是正方法が「手動修正」、検証結果が「失敗」、データ整合性スコアが65の場合、正常に詳細情報が返される', async () => {
    const discrepancyId = 'diff-744-001';

    const mockDiscrepancyData = {
      id: 'diff-744-001',
      差異ID: 'diff-744-001',
      旧システム請求書ID: 'legacy-inv-744',
      新システム請求書ID: 'new-inv-744',
      差異種類: '金額差異',
      差異内容: '請求金額の不整合',
      金額差異: 250000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-10-07T10:00:00.000Z',
      重大度: '高',
      原因分類: 'システムエラー',
      許容範囲判定: '範囲外',
      判定日時: '2026-10-07T10:15:00.000Z',
      判定者: 'judge-001',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-744',
      請求書ID: 'legacy-inv-744',
      ユーザーID: 'user-001',
      請求書番号: 'LG-2026-0744',
      請求日: '2026-10-01T00:00:00.000Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '未払い',
      支払期限日: '2026-10-31T23:59:59.999Z',
      摘要: 'システム移行期間分',
      作成日時: '2026-10-01T09:00:00.000Z',
      更新日時: '2026-10-01T09:00:00.000Z',
      検証ステータス: '検証待ち',
      検証日時: null,
    };

    const mockNewInvoice = {
      id: 'new-inv-744',
      請求書ID: 'new-inv-744',
      請求書番号: 'NEW-2026-0744',
      請求日: '2026-10-02T00:00:00.000Z',
      請求金額: 750000,
      税金額: 75000,
      ステータス: '未払い',
      支払期限日: '2026-11-01T23:59:59.999Z',
      摘要: 'システム移行期間分',
    };

    const mockCorrectionTracking = {
      id: 'corr-744-001',
      是正ID: 'corr-744-001',
      差異ID: 'diff-744-001',
      是正方法: '手動修正',
      是正ステータス: '実行完了',
      是正実行者: 'admin-001',
      是正実行日時: '2026-10-07T11:00:00.000Z',
      是正前データ: '{"請求金額": 1000000}',
      是正後データ: '{"請求金額": 750000}',
      検証結果: '失敗',
    };

    const mockConfirmationHistory = {
      id: 'conf-744-001',
      確認ID: 'conf-744-001',
      差異ID: 'diff-744-001',
      確認ユーザーID: 'manager-001',
      確認日時: '2026-10-07T12:00:00.000Z',
      確認内容: '金額差異が大きく、手動修正後も検証結果がNG。ロールバック検討が必要。データ整合性スコア計算結果: 65',
      判定結果: 'ロールバック検討',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyData]) // 差異検出結果テーブル
      .mockResolvedValueOnce([mockLegacyInvoice]) // 旧システム請求書テーブル
      .mockResolvedValueOnce([mockNewInvoice]) // 新システム請求書テーブル
      .mockResolvedValueOnce([mockCorrectionTracking]) // 是正追跡管理履歴
      .mockResolvedValueOnce([mockConfirmationHistory]); // 差異確認履歴

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-744-001');
    expect(result.discrepancyDetection.amountDifference).toBe(250000);
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceAmount).toBe(750000);
    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('手動修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行完了');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('失敗');
    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('ロールバック検討');
  });
});
