import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-647: 件数差分が0件で金額差分が0.1%未満かつステータス不整合が0件の場合、リスク程度を「軽微」と判定して継続監視を推奨できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy with minimal differences when amount difference is less than 0.1%', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyData = {
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-INV-001',
      新システム請求書ID: 'NEW-INV-001',
      差異種類: '金額不一致',
      差異内容: '請求金額が微小範囲内で異なる',
      金額差異: 8500,
      件数差異: 0,
      ステータス差異: '',
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '低',
      原因分類: '丸め誤差',
      許容範囲判定: '許容範囲内',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: '550e8400-e29b-41d4-a716-446655440001',
    };

    const legacyInvoiceData = {
      請求書ID: 'LEGACY-INV-001',
      ユーザーID: 'USER-001',
      請求書番号: 'LEGACY-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '請求済',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '2026年1月分商品代金',
    };

    const newInvoiceData = {
      請求書ID: 'NEW-INV-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1000008500,
      税金額: 100000,
      ステータス: '請求済',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '2026年1月分商品代金',
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

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.金額差異).toBe(8500);
    expect(result.discrepancyDetection.件数差異).toBe(0);
    expect(result.discrepancyDetection.ステータス差異).toBe('');
    expect(result.discrepancyDetection.許容範囲判定).toBe('許容範囲内');
    expect(result.discrepancyDetection.原因分類).toBe('丸め誤差');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEGACY-2026-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2026-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1000008500);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
