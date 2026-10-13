import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-785: リスク程度が『軽微』と判定された場合、推奨対応が『継続監視』となる', () => {
  const mockListRecords = jest.mocked(dataStore.listRecords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('軽微な差異詳細情報をダッシュボード用に返す', async () => {
    const discrepancyId = 'd-785-001';

    const discrepancyDetectionData = [
      {
        id: discrepancyId,
        差異ID: discrepancyId,
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '金額差異',
        差異内容: '税金計算の端数処理が異なる',
        金額差異: 15,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '軽微',
        原因分類: '端数処理',
        許容範囲判定: '許容内',
        判定日時: '2026-01-15T11:00:00Z',
        判定者: 'user-judge-001',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-inv-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-cust-001',
        請求書番号: 'INV-2026-00001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '確定',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: 'サービス提供費用',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: '待機中',
        検証日時: null,
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-inv-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'INV-2026-00001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100015,
        税金額: 10001,
        ステータス: '確定',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: 'サービス提供費用',
        createdAt: '2026-01-10T09:05:00Z',
        updatedAt: '2026-01-10T09:05:00Z',
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
          return [];
        case '差異確認履歴':
          return [];
        default:
          return [];
      }
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection).toMatchObject({
      discrepancyId: discrepancyId,
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '金額差異',
      discrepancyContent: '税金計算の端数処理が異なる',
      amountDifference: 15,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:30:00Z',
      severity: '軽微',
      causeClassification: '端数処理',
      toleranceJudgment: '許容内',
      toleranceJudgmentDateTime: '2026-01-15T11:00:00Z',
      judgedByUserId: 'user-judge-001',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'INV-2026-00001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'サービス提供費用',
    });
    expect(result.newSystemInvoice).toMatchObject({
      invoiceId: 'new-inv-001',
      invoiceNumber: 'INV-2026-00001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100015,
      taxAmount: 10001,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'サービス提供費用',
    });
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
