import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-636: 許容範囲の値が負数の場合、検証を中止して「許容範囲は0以上の値を指定してください」エラーを出力できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle tolerance judgment as status value when discrepancy details are retrieved', async () => {
    const discrepancyId = 'diff-001';

    const discrepancyData = {
      id: 'diff-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額に差異あり',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '税計算誤り',
      許容範囲判定: '超過',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: 'user-001',
    };

    const legacyInvoiceData = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'LG-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '未払い',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '1月分請求',
    };

    const newInvoiceData = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 105000,
      税金額: 10500,
      ステータス: '未払い',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '1月分請求',
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

    expect(result.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.許容範囲判定).toBe('超過');
    expect(dataStore.listRecords).toHaveBeenCalledWith('差異検出結果');
    expect(dataStore.listRecords).toHaveBeenCalledWith('旧システム請求書');
    expect(dataStore.listRecords).toHaveBeenCalledWith('新システム請求書');
    expect(dataStore.listRecords).toHaveBeenCalledWith('是正追跡管理');
    expect(dataStore.listRecords).toHaveBeenCalledWith('差異確認履歴');
  });
});
