import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-650: 金額差分10万円以上100万円未満は優先度「高」', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差分500000円は優先度「高」として分類される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDiscrepancyDetection = {
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-2024-001',
      新システム請求書ID: 'NEW-2024-001',
      差異種類: '金額差異',
      差異内容: '請求金額の不一致',
      金額差異: 500000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'システム計算誤差',
      許容範囲判定: '範囲外',
      判定日時: '2024-01-15T11:00:00Z',
      判定者: 'user-123',
    };

    const mockLegacyInvoice = {
      請求書ID: 'LEGACY-2024-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-LEGACY-2024-001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 5000000,
      税金額: 500000,
      ステータス: '確定',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '2024年1月分サービス料金',
    };

    const mockNewInvoice = {
      請求書ID: 'NEW-2024-001',
      請求書番号: 'INV-NEW-2024-001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 4500000,
      税金額: 450000,
      ステータス: '確定',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '2024年1月分サービス料金',
    };

    const mockCorrectionTracking = {
      是正ID: '660e8400-e29b-41d4-a716-446655440001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      是正方法: '単価修正',
      是正ステータス: '実行済み',
      是正実行者: 'user-456',
      是正実行日時: '2024-01-16T14:20:00Z',
      是正前データ: '{"金額": 4500000}',
      是正後データ: '{"金額": 5000000}',
      検証結果: '検証成功',
    };

    const mockConfirmationHistory = {
      確認ID: '770e8400-e29b-41d4-a716-446655440002',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      確認ユーザーID: 'user-789',
      確認日時: '2024-01-17T09:15:00Z',
      確認内容: '原因分析完了、是正対応確認',
      判定結果: '確認完了',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyDetection])
      .mockResolvedValueOnce([mockLegacyInvoice])
      .mockResolvedValueOnce([mockNewInvoice])
      .mockResolvedValueOnce([mockCorrectionTracking])
      .mockResolvedValueOnce([mockConfirmationHistory]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.amountDifference).toBe(500000);
    expect(result.discrepancyDetection.amountDifference >= 100000).toBe(true);
    expect(result.discrepancyDetection.amountDifference < 1000000).toBe(true);
    expect(result.discrepancyDetection.causeClassification).toBe('システム計算誤差');
    expect(result.discrepancyDetection.severity).toBe('高');

    expect(result.legacySystemInvoice?.invoiceId).toBe('LEGACY-2024-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('INV-LEGACY-2024-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(5000000);

    expect(result.newSystemInvoice?.invoiceId).toBe('NEW-2024-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('INV-NEW-2024-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(4500000);

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行済み');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('検証成功');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('確認完了');
  });
});
