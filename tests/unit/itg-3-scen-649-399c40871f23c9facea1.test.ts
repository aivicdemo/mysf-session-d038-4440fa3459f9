import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-649: 金額差分100万円以上または請求済みステータスは優先度「緊急」', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差分1500000円かつステータスが「請求済み」で優先度「緊急」と分類される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDiscrepancyDetection = {
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-INV-2024-001',
      新システム請求書ID: 'NEW-INV-2024-001',
      差異種類: '金額差分',
      差異内容: '請求金額が異なる',
      金額差異: 1500000,
      件数差異: 0,
      ステータス差異: '',
      検出日時: '2024-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'システム移行時のマッピングエラー',
      許容範囲判定: '範囲外',
      判定日時: '2024-01-15T11:00:00Z',
      判定者: '00000000-0000-0000-0000-000000000001',
    };

    const mockLegacyInvoice = {
      請求書ID: 'LEGACY-INV-2024-001',
      ユーザーID: 'USR-001',
      請求書番号: 'LEGACY-2024-001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 5000000,
      税金額: 500000,
      ステータス: '請求済み',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '1月度請求書',
      作成日時: '2024-01-10T08:00:00Z',
      更新日時: '2024-01-10T08:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
    };

    const mockNewInvoice = {
      請求書ID: 'NEW-INV-2024-001',
      請求書番号: 'NEW-2024-001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 3500000,
      税金額: 350000,
      ステータス: '請求済み',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '1月度請求書',
    };

    const mockCorrectionTracking = {
      是正ID: '660e8400-e29b-41d4-a716-446655440000',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      是正方法: '手動調整',
      是正ステータス: '実行中',
      是正実行者: '00000000-0000-0000-0000-000000000002',
      是正実行日時: '2024-01-15T14:00:00Z',
      是正前データ: '{"請求金額": 5000000}',
      是正後データ: '{"請求金額": 3500000}',
      検証結果: '成功',
    };

    const mockConfirmationHistory = {
      確認ID: '770e8400-e29b-41d4-a716-446655440000',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      確認ユーザーID: '00000000-0000-0000-0000-000000000003',
      確認日時: '2024-01-15T15:30:00Z',
      確認内容: '金額差分は旧システムのレート換算ミスが原因',
      判定結果: '承認',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyDetection])
      .mockResolvedValueOnce([mockLegacyInvoice])
      .mockResolvedValueOnce([mockNewInvoice])
      .mockResolvedValueOnce([mockCorrectionTracking])
      .mockResolvedValueOnce([mockConfirmationHistory]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.amountDifference).toBe(1500000);
    expect(result.discrepancyDetection.amountDifference >= 1000000).toBe(true);
    expect(result.discrepancyDetection.causeClassification).toBe('システム移行時のマッピングエラー');

    expect(result.legacySystemInvoice?.invoiceId).toBe('LEGACY-INV-2024-001');
    expect(result.legacySystemInvoice?.status).toBe('請求済み');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(5000000);

    expect(result.newSystemInvoice?.invoiceId).toBe('NEW-INV-2024-001');
    expect(result.newSystemInvoice?.status).toBe('請求済み');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(3500000);

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('660e8400-e29b-41d4-a716-446655440000');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行中');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('770e8400-e29b-41d4-a716-446655440000');
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
