import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-652: 差異検出時に通知サービスを呼び出してアラート通知を送信', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果を取得し、重大度「高」のデータが正常に返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDiscrepancyDetection = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-INV-20250101-001',
      新システム請求書ID: 'NEW-INV-20250101-001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'システムバグ',
      許容範囲判定: '外',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'user-001',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    };

    const mockLegacyInvoice = {
      id: 'legacy-record-001',
      請求書ID: 'LEGACY-INV-20250101-001',
      ユーザーID: 'customer-001',
      請求書番号: 'LEGACY-2025-0001',
      請求日: '2025-01-01T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '送信済み',
      支払期限日: '2025-02-01T00:00:00Z',
      摘要: '2025年1月分請求',
      作成日時: '2024-12-25T00:00:00Z',
      更新日時: '2025-01-01T00:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
      createdAt: '2024-12-25T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockNewInvoice = {
      id: 'new-record-001',
      請求書ID: 'NEW-INV-20250101-001',
      請求書番号: 'NEW-2025-0001',
      請求日: '2025-01-01T00:00:00Z',
      請求金額: 950000,
      税金額: 95000,
      ステータス: '送信済み',
      支払期限日: '2025-02-01T00:00:00Z',
      摘要: '2025年1月分請求',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockCorrectionTracking = {
      id: 'correction-001',
      是正ID: 'correction-001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      是正方法: 'データ修正',
      是正ステータス: '実行完了',
      是正実行者: 'user-002',
      是正実行日時: '2025-01-16T09:00:00Z',
      是正前データ: '{"請求金額": 950000}',
      是正後データ: '{"請求金額": 1000000}',
      検証結果: '成功',
      createdAt: '2025-01-16T09:00:00Z',
      updatedAt: '2025-01-16T09:00:00Z',
    };

    const mockConfirmationHistory = {
      id: 'confirmation-001',
      確認ID: 'confirmation-001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      確認ユーザーID: 'user-003',
      確認日時: '2025-01-17T14:30:00Z',
      確認内容: '是正が適切に実施されたことを確認しました',
      判定結果: '承認',
      createdAt: '2025-01-17T14:30:00Z',
      updatedAt: '2025-01-17T14:30:00Z',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyDetection])
      .mockResolvedValueOnce([mockLegacyInvoice])
      .mockResolvedValueOnce([mockNewInvoice])
      .mockResolvedValueOnce([mockCorrectionTracking])
      .mockResolvedValueOnce([mockConfirmationHistory]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('システムバグ');
    expect(result.discrepancyDetection.amountDifference).toBe(50000);

    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEGACY-2025-0001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);

    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2025-0001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(950000);

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('データ修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行完了');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
