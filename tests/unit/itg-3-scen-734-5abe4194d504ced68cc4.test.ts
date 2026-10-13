import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-734: 差異検出時の重大度別エスカレーションと是正指示 - 許容範囲内と判定', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('許容範囲判定で差異が許容範囲内と判定された場合、判定結果が永続化され、エスカレーション対象にならない', async () => {
    const discrepancyData = [
      {
        id: 'diff-12345-uuid',
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '金額差異',
        差異内容: '請求金額が異なる',
        金額差異: 1000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: '中',
        原因分類: '税計算誤差',
        許容範囲判定: '許容範囲内',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: 'user-uuid-001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-invoice-uuid-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-001',
        請求書番号: 'LEG-2025-00001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '請求済',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '年間保守契約',
        作成日時: '2025-01-10T08:00:00Z',
        更新日時: '2025-01-10T08:00:00Z',
        検証ステータス: '検証完了',
        検証日時: '2025-01-15T10:30:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-invoice-uuid-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'NEW-2025-00001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 101000,
        税金額: 10100,
        ステータス: '請求済',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '年間保守契約',
      },
    ];

    const confirmationHistoryData = [
      {
        id: 'confirm-uuid-001',
        差異ID: 'diff-12345-uuid',
        確認ユーザーID: 'user-uuid-001',
        確認日時: '2025-01-15T11:00:00Z',
        確認内容: '税計算誤差により生じた1000円の差異を確認。許容範囲内と判定。',
        判定結果: '許容範囲内',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve([]);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId: 'diff-12345-uuid',
    });

    expect(result.discrepancyId).toBe('diff-12345-uuid');

    expect(result.discrepancyDetection.toleranceJudgment).toBe('許容範囲内');
    expect(result.discrepancyDetection.severity).toBe('中');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2025-01-15T11:00:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('user-uuid-001');

    expect(result.legacySystemInvoice!.invoiceNumber).toBe('LEG-2025-00001');
    expect(result.legacySystemInvoice!.invoiceAmount).toBe(100000);
    expect(result.legacySystemInvoice!.status).toBe('請求済');

    expect(result.newSystemInvoice!.invoiceNumber).toBe('NEW-2025-00001');
    expect(result.newSystemInvoice!.invoiceAmount).toBe(101000);
    expect(result.newSystemInvoice!.status).toBe('請求済');

    expect(result.correctionTrackingHistory).toHaveLength(0);

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-uuid-001');
    expect(result.confirmationHistory[0].judgmentResult).toBe('許容範囲内');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2025-01-15T11:00:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('税計算誤差により生じた1000円の差異を確認。許容範囲内と判定。');
  });
});
