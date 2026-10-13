import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-644: 営業部門全体の目標売上が0円の場合、警告「目標売上が設定されていないため、金額差分の相対評価ができません」を出力してリスク評価を継続できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy details and continue when target revenue is zero', async () => {
    const discrepancyId = 'diff-uuid-644-001';

    const discrepancyData = {
      差異ID: 'diff-uuid-644-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '営業部門の目標売上設定が0円のため相対評価ができない',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '中',
      原因分類: '目標値設定誤り',
      許容範囲判定: '範囲外',
      判定日時: '2026-01-15T10:45:00Z',
      判定者: 'user-uuid-001',
    };

    const legacyInvoiceData = {
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '確定',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '営業部門1月売上',
      作成日時: '2026-01-10T08:00:00Z',
      更新日時: '2026-01-10T08:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
    };

    const newInvoiceData = {
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-INV-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1050000,
      税金額: 105000,
      ステータス: '確定',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '営業部門1月売上',
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
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-uuid-644-001');
    expect(result.discrepancyDetection.差異内容).toBe('営業部門の目標売上設定が0円のため相対評価ができない');
    expect(result.discrepancyDetection.原因分類).toBe('目標値設定誤り');
    expect(result.discrepancyDetection.金額差異).toBe(50000);
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('INV-2026-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-INV-2026-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1050000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
