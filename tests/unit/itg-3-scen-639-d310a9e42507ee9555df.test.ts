import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-639: 金額ズレが許容範囲内の場合、検証結果を「警告」と判定できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy with tolerance judgment as within tolerance when amount difference is acceptable', async () => {
    const discrepancyId = 'diff-001';

    const discrepancyData = {
      差異ID: 'diff-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額',
      差異内容: '請求金額に差異あり',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '中',
      原因分類: 'システム移行時の丸め処理',
      許容範囲判定: '許容範囲内',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: 'user-judge-001',
    };

    const legacyInvoiceData = {
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'cust-001',
      請求書番号: 'LEG-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '請求済み',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '商品A・Bの販売',
      作成日時: '2026-01-10T09:00:00Z',
      更新日時: '2026-01-10T09:00:00Z',
      検証ステータス: '検証待ち',
      検証日時: null,
    };

    const newInvoiceData = {
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1005000,
      税金額: 100500,
      ステータス: '請求済み',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '商品A・Bの販売',
    };

    const confirmationHistoryData = {
      確認ID: 'conf-001',
      差異ID: 'diff-001',
      確認ユーザーID: 'user-reviewer-001',
      確認日時: '2026-01-15T14:00:00Z',
      確認内容: '許容範囲内の金額ズレとして承認',
      判定結果: '警告',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([discrepancyData]);
      }
      if (tableName === '旧システム請求書') {
        return Promise.resolve([legacyInvoiceData]);
      }
      if (tableName === '新システム請求書') {
        return Promise.resolve([newInvoiceData]);
      }
      if (tableName === '是正追跡管理') {
        return Promise.resolve([]);
      }
      if (tableName === '差異確認履歴') {
        return Promise.resolve([confirmationHistoryData]);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.許容範囲判定).toBe('許容範囲内');
    expect(result.discrepancyDetection.金額差異).toBe(5000);
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1005000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('警告');
  });
});
