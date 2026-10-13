import { jest } from '@jest/globals';
import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-207: 指定された差異IDが存在し、旧新システム請求書データも存在する場合', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

  const discrepancyDetectionRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    差異ID: '550e8400-e29b-41d4-a716-446655440000',
    旧システム請求書ID: 'LEGACY-INV-2024-001',
    新システム請求書ID: 'NEW-INV-2024-001',
    差異種類: '金額差異',
    差異内容: '請求金額が旧システムでは150000円、新システムでは155000円で5000円の差異',
    金額差異: 5000,
    件数差異: 0,
    ステータス差異: null,
    検出日時: '2024-12-15T10:30:00Z',
    重大度: 'HIGH',
    原因分類: '税計算誤差',
    許容範囲判定: 'OUT_OF_RANGE',
    判定日時: '2024-12-15T11:00:00Z',
    判定者: 'a0000000-0000-0000-0000-000000000001',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T11:00:00Z',
  };

  const legacySystemInvoiceRecord = {
    id: 'legacy-rec-001',
    請求書ID: 'LEGACY-INV-2024-001',
    ユーザーID: 'USER-001',
    請求書番号: 'LEG-2024-12-0001',
    請求日: '2024-12-01T00:00:00Z',
    請求金額: 150000,
    税金額: 15000,
    ステータス: 'ISSUED',
    支払期限日: '2025-01-31T00:00:00Z',
    摘要: '商品A販売',
    作成日時: '2024-12-01T09:00:00Z',
    更新日時: '2024-12-01T09:00:00Z',
    検証ステータス: 'PENDING',
    検証日時: null,
  };

  const newSystemInvoiceRecord = {
    id: 'new-rec-001',
    請求書ID: 'NEW-INV-2024-001',
    請求書番号: 'NEW-2024-12-0001',
    請求日: '2024-12-01T00:00:00Z',
    請求金額: 155000,
    税金額: 15500,
    ステータス: 'ISSUED',
    支払期限日: '2025-01-31T00:00:00Z',
    摘要: '商品A販売',
  };

  const correctionTrackingRecord = {
    id: 'correction-001',
    是正ID: 'c0000000-0000-0000-0000-000000000001',
    差異ID: '550e8400-e29b-41d4-a716-446655440000',
    是正方法: 'MANUAL_ADJUSTMENT',
    是正ステータス: 'COMPLETED',
    是正実行者: 'a0000000-0000-0000-0000-000000000002',
    是正実行日時: '2024-12-16T14:30:00Z',
    是正前データ: '{"請求金額": 150000, "税金額": 15000}',
    是正後データ: '{"請求金額": 155000, "税金額": 15500}',
    検証結果: 'VERIFIED',
    createdAt: '2024-12-16T14:30:00Z',
    updatedAt: '2024-12-16T14:30:00Z',
  };

  const confirmationHistoryRecord = {
    id: 'confirm-001',
    確認ID: 'd0000000-0000-0000-0000-000000000001',
    差異ID: '550e8400-e29b-41d4-a716-446655440000',
    確認ユーザーID: 'a0000000-0000-0000-0000-000000000003',
    確認日時: '2024-12-16T15:45:00Z',
    確認内容: '是正内容を確認。税計算誤差が新システムで正しく反映されている。',
    判定結果: 'APPROVED',
    createdAt: '2024-12-16T15:45:00Z',
    updatedAt: '2024-12-16T15:45:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      switch (tableName) {
        case '差異検出結果':
          return Promise.resolve([discrepancyDetectionRecord]);
        case '旧システム請求書':
          return Promise.resolve([legacySystemInvoiceRecord]);
        case '新システム請求書':
          return Promise.resolve([newSystemInvoiceRecord]);
        case '是正追跡管理':
          return Promise.resolve([correctionTrackingRecord]);
        case '差異確認履歴':
          return Promise.resolve([confirmationHistoryRecord]);
        default:
          return Promise.resolve([]);
      }
    });
  });

  it('差異検出結果・両請求書データ・是正履歴・確認履歴を整形して返す', async () => {
    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection).toEqual({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEGACY-INV-2024-001',
      newSystemInvoiceId: 'NEW-INV-2024-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が旧システムでは150000円、新システムでは155000円で5000円の差異',
      amountDifference: 5000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2024-12-15T10:30:00Z',
      severity: 'HIGH',
      causeClassification: '税計算誤差',
      toleranceJudgment: 'OUT_OF_RANGE',
      toleranceJudgmentDateTime: '2024-12-15T11:00:00Z',
      judgedByUserId: 'a0000000-0000-0000-0000-000000000001',
    });

    expect(result.legacySystemInvoice).toEqual({
      invoiceId: 'LEGACY-INV-2024-001',
      invoiceNumber: 'LEG-2024-12-0001',
      invoiceDate: '2024-12-01T00:00:00Z',
      invoiceAmount: 150000,
      taxAmount: 15000,
      status: 'ISSUED',
      paymentDueDate: '2025-01-31T00:00:00Z',
      remarks: '商品A販売',
    });

    expect(result.newSystemInvoice).toEqual({
      invoiceId: 'NEW-INV-2024-001',
      invoiceNumber: 'NEW-2024-12-0001',
      invoiceDate: '2024-12-01T00:00:00Z',
      invoiceAmount: 155000,
      taxAmount: 15500,
      status: 'ISSUED',
      paymentDueDate: '2025-01-31T00:00:00Z',
      remarks: '商品A販売',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toEqual({
      correctionId: 'c0000000-0000-0000-0000-000000000001',
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: 'MANUAL_ADJUSTMENT',
      correctionStatus: 'COMPLETED',
      correctionExecutorUserId: 'a0000000-0000-0000-0000-000000000002',
      correctionExecutionDateTime: '2024-12-16T14:30:00Z',
      dataBeforeCorrection: '{"請求金額": 150000, "税金額": 15000}',
      dataAfterCorrection: '{"請求金額": 155000, "税金額": 15500}',
      verificationResult: 'VERIFIED',
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toEqual({
      confirmationId: 'd0000000-0000-0000-0000-000000000001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationUserId: 'a0000000-0000-0000-0000-000000000003',
      confirmationDateTime: '2024-12-16T15:45:00Z',
      confirmationContent: '是正内容を確認。税計算誤差が新システムで正しく反映されている。',
      judgmentResult: 'APPROVED',
    });
  });
});
