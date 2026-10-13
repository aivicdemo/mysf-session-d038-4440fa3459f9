import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-637: 対応する請求書が旧新で見つからない件がある場合、警告「対応する請求書が見つからない件があります。データ移行の完全性を確認してください」を出力して検証を継続できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for new system invoice when it is not found and continue with warning', async () => {
    const discrepancyId = 'diff-uuid-001';

    const discrepancyData = {
      id: 'diff-uuid-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: null,
      差異種類: '金額差異',
      差異内容: '請求金額が一致しない',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '未分類',
      許容範囲判定: '範囲外',
      判定日時: '2025-01-15T10:35:00Z',
      判定者: 'user-uuid-001',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:35:00Z',
    };

    const legacyInvoiceData = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-2025-001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 105000,
      税金額: 5000,
      ステータス: '確定',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '商品A供給',
      作成日時: '2025-01-10T09:00:00Z',
      更新日時: '2025-01-10T09:00:00Z',
      検証ステータス: '検証待ち',
      検証日時: null,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-01-10T09:00:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([discrepancyData]);
      }
      if (tableName === '旧システム請求書') {
        return Promise.resolve([legacyInvoiceData]);
      }
      if (tableName === '新システム請求書') {
        return Promise.resolve([]);
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

    expect(result.discrepancyId).toBe('diff-uuid-001');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('INV-2025-001');
    expect(result.newSystemInvoice).toBeNull();
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
