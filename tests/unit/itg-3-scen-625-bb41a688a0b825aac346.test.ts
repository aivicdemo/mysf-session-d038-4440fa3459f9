import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-625: 差異が検出された状態で、検出済み差異の詳細情報を取得して原因分類対象データとして確定できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDを指定して詳細情報を取得できる', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionRecord = {
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-INV-2024-001',
      新システム請求書ID: 'NEW-INV-2024-001',
      差異種類: '金額差異',
      差異内容: '請求金額が一致しない',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-11-15T10:30:00Z',
      重大度: 'HIGH',
      原因分類: null,
      許容範囲判定: null,
      判定日時: null,
      判定者: null,
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2024-11-15T10:30:00Z',
      updatedAt: '2024-11-15T10:30:00Z',
    };

    const legacyInvoiceRecord = {
      請求書ID: 'LEGACY-INV-2024-001',
      ユーザーID: 'USER-001',
      請求書番号: 'LG-2024-0001',
      請求日: '2024-11-01T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '請求済み',
      支払期限日: '2024-12-01T00:00:00Z',
      摘要: '製品A納入分',
      id: 'LEGACY-INV-2024-001',
      createdAt: '2024-11-01T09:00:00Z',
      updatedAt: '2024-11-01T09:00:00Z',
    };

    const newInvoiceRecord = {
      請求書ID: 'NEW-INV-2024-001',
      請求書番号: 'NEW-2024-0001',
      請求日: '2024-11-01T00:00:00Z',
      請求金額: 950000,
      税金額: 95000,
      ステータス: '請求済み',
      支払期限日: '2024-12-01T00:00:00Z',
      摘要: '製品A納入分',
      id: 'NEW-INV-2024-001',
      createdAt: '2024-11-01T08:00:00Z',
      updatedAt: '2024-11-01T08:00:00Z',
    };

    const correctionRecord = {
      是正ID: '650e8400-e29b-41d4-a716-446655440001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      是正方法: '手動修正',
      是正ステータス: '実行済み',
      是正実行者: '750e8400-e29b-41d4-a716-446655440002',
      是正実行日時: '2024-11-16T14:00:00Z',
      是正前データ: '{"請求金額": 950000}',
      是正後データ: '{"請求金額": 1000000}',
      検証結果: '成功',
      id: '650e8400-e29b-41d4-a716-446655440001',
      createdAt: '2024-11-16T14:00:00Z',
      updatedAt: '2024-11-16T14:00:00Z',
    };

    const confirmationRecord = {
      確認ID: '750e8400-e29b-41d4-a716-446655440003',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      確認ユーザーID: '850e8400-e29b-41d4-a716-446655440004',
      確認日時: '2024-11-15T15:45:00Z',
      確認内容: '金額差異を確認し、新システム側のデータ入力誤りと判定',
      判定結果: '要是正',
      id: '750e8400-e29b-41d4-a716-446655440003',
      createdAt: '2024-11-15T15:45:00Z',
      updatedAt: '2024-11-15T15:45:00Z',
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

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額が一致しない');
    expect(result.discrepancyDetection.amountDifference).toBe(50000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2024-11-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('HIGH');

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('LEGACY-INV-2024-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LG-2024-0001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(100000);
    expect(result.legacySystemInvoice?.status).toBe('請求済み');
    expect(result.legacySystemInvoice?.paymentDueDate).toBe('2024-12-01T00:00:00Z');
    expect(result.legacySystemInvoice?.remarks).toBe('製品A納入分');

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('NEW-INV-2024-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2024-0001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(950000);
    expect(result.newSystemInvoice?.taxAmount).toBe(95000);
    expect(result.newSystemInvoice?.status).toBe('請求済み');
    expect(result.newSystemInvoice?.paymentDueDate).toBe('2024-12-01T00:00:00Z');
    expect(result.newSystemInvoice?.remarks).toBe('製品A納入分');

    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('650e8400-e29b-41d4-a716-446655440001');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('手動修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行済み');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('750e8400-e29b-41d4-a716-446655440002');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2024-11-16T14:00:00Z');
    expect(result.correctionTrackingHistory[0].dataBeforeCorrection).toBe('{"請求金額": 950000}');
    expect(result.correctionTrackingHistory[0].dataAfterCorrection).toBe('{"請求金額": 1000000}');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('750e8400-e29b-41d4-a716-446655440003');
    expect(result.confirmationHistory[0].confirmationUserId).toBe('850e8400-e29b-41d4-a716-446655440004');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-11-15T15:45:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('金額差異を確認し、新システム側のデータ入力誤りと判定');
    expect(result.confirmationHistory[0].judgmentResult).toBe('要是正');
  });
});
