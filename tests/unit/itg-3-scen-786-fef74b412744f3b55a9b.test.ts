import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-786: 件数差分が発生した場合、影響を受ける業務領域に『請求処理』が追加される', () => {
  const mockListRecords = jest.mocked(dataStore.listRecords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('件数差分を含むすべての差異詳細情報を返す', async () => {
    const discrepancyId = 'diff-uuid-12345';

    const discrepancyDetectionData = [
      {
        id: discrepancyId,
        差異ID: discrepancyId,
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '件数差分',
        差異内容: '請求明細行の件数が一致しない',
        金額差異: 0,
        件数差異: 3,
        ステータス差異: null,
        検出日時: '2026-10-07T10:00:00Z',
        重大度: 'HIGH',
        原因分類: 'DATA_MIGRATION_ERROR',
        許容範囲判定: 'OUT_OF_RANGE',
        判定日時: '2026-10-07T10:05:00Z',
        判定者: 'judge-uuid-001',
        createdAt: '2026-10-07T10:00:00Z',
        updatedAt: '2026-10-07T10:05:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-record-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-001',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-10-01T09:00:00Z',
        請求金額: 1000000,
        税金額: 100000,
        ステータス: 'ISSUED',
        支払期限日: '2026-11-01T23:59:59Z',
        摘要: '商品・サービス提供',
        作成日時: '2026-10-01T09:00:00Z',
        更新日時: '2026-10-01T09:00:00Z',
        検証ステータス: 'PENDING',
        検証日時: null,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-01T09:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-record-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-10-01T09:00:00Z',
        請求金額: 1000000,
        税金額: 100000,
        ステータス: 'ISSUED',
        支払期限日: '2026-11-01T23:59:59Z',
        摘要: '商品・サービス提供',
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-01T09:00:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'correction-uuid-001',
        是正ID: 'correction-uuid-001',
        差異ID: discrepancyId,
        是正方法: 'MANUAL_ADJUSTMENT',
        是正ステータス: 'IN_PROGRESS',
        是正実行者: 'corrector-uuid-001',
        是正実行日時: '2026-10-07T11:00:00Z',
        是正前データ: '{"lineCount": 10}',
        是正後データ: '{"lineCount": 13}',
        検証結果: 'PENDING',
        createdAt: '2026-10-07T11:00:00Z',
        updatedAt: '2026-10-07T11:00:00Z',
      },
    ];

    const confirmationData = [
      {
        id: 'confirm-uuid-001',
        確認ID: 'confirm-uuid-001',
        差異ID: discrepancyId,
        確認ユーザーID: 'reviewer-uuid-001',
        確認日時: '2026-10-07T12:00:00Z',
        確認内容: '請求明細行の件数差分を確認。旧システムは10行、新システムは13行。',
        判定結果: 'CONFIRMED',
        createdAt: '2026-10-07T12:00:00Z',
        updatedAt: '2026-10-07T12:00:00Z',
      },
    ];

    mockListRecords.mockImplementation(async (tableName: string) => {
      switch (tableName) {
        case '差異検出結果':
          return discrepancyDetectionData as any;
        case '旧システム請求書':
          return legacyInvoiceData as any;
        case '新システム請求書':
          return newInvoiceData as any;
        case '是正追跡管理':
          return correctionTrackingData as any;
        case '差異確認履歴':
          return confirmationData as any;
        default:
          return [];
      }
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection).toMatchObject({
      discrepancyType: '件数差分',
      discrepancyContent: '請求明細行の件数が一致しない',
      amountDifference: 0,
      countDifference: 3,
      severity: 'HIGH',
      toleranceJudgment: 'OUT_OF_RANGE',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: 'ISSUED',
    });
    expect(result.newSystemInvoice).toMatchObject({
      invoiceId: 'new-inv-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: 'ISSUED',
    });
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      correctionMethod: 'MANUAL_ADJUSTMENT',
      correctionStatus: 'IN_PROGRESS',
    });
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      confirmationUserId: 'reviewer-uuid-001',
      confirmationDateTime: '2026-10-07T12:00:00Z',
      judgmentResult: 'CONFIRMED',
    });
  });
});
