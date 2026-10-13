import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-640: 金額ズレが許容範囲を超える場合、検証結果を「不合格」と判定できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy with tolerance judgment as exceeding tolerance when amount difference is significant', async () => {
    const discrepancyId = 'diff-2024-001';

    const discrepancyData = {
      id: 'diff-2024-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額に差異あり',
      金額差異: 15000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-01-15T10:30:00Z',
      重大度: 'high',
      原因分類: '税金計算誤り',
      許容範囲判定: '超過',
      判定日時: '2024-01-15T11:00:00Z',
      判定者: 'user-001',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    };

    const legacyInvoiceData = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-legacy-001',
      請求書番号: 'LG-2024-0001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'issued',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商品販売',
      作成日時: '2024-01-10T09:00:00Z',
      更新日時: '2024-01-10T09:00:00Z',
      検証ステータス: 'pending',
      検証日時: null,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
    };

    const newInvoiceData = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NW-2024-0001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 985000,
      税金額: 85000,
      ステータス: 'issued',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商品販売',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
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

    expect(result.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection.許容範囲判定).toBe('超過');
    expect(result.discrepancyDetection.金額差異).toBe(15000);
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceAmount).toBe(985000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
