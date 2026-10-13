import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-784: リスク程度が『中程度』と判定された場合、推奨対応が『手作業で検証を実施』となる', () => {
  const mockListRecords = jest.mocked(dataStore.listRecords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('中程度の差異詳細情報をすべて返す', async () => {
    const discrepancyId = 'diff-001';

    const discrepancyDetectionData = [
      {
        id: discrepancyId,
        差異ID: discrepancyId,
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '金額差異',
        差異内容: '請求金額が異なる',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '中程度',
        原因分類: '計算ロジック相違',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T11:00:00Z',
        判定者: 'user-001',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-001',
        請求書番号: 'LEG-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 105000,
        税金額: 10500,
        ステータス: '未払い',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A販売',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'NEW-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '未払い',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A販売',
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
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
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が異なる',
      amountDifference: 5000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:30:00Z',
      severity: '中程度',
      causeClassification: '計算ロジック相違',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2026-01-15T11:00:00Z',
      judgedByUserId: 'user-001',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      invoiceNumber: 'LEG-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 105000,
      taxAmount: 10500,
      status: '未払い',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品A販売',
    });
    expect(result.newSystemInvoice).toMatchObject({
      invoiceNumber: 'NEW-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '未払い',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品A販売',
    });
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
