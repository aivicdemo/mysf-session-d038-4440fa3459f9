import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-643: 新システムのレコード件数が0件の場合、リスク評価を中止して「新システムのデータが取得できません。同期状況を確認してください」エラーを出力できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NewInvoiceNotFoundError when new system invoice data is not found', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyData = {
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-2024-001',
      新システム請求書ID: 'NEW-2024-001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 10000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '税計算誤り',
      許容範囲判定: '範囲外',
      判定日時: '2024-01-15T11:00:00Z',
      判定者: 'user-001',
    };

    const legacyInvoiceData = {
      請求書ID: 'LEGACY-2024-001',
      ユーザーID: 'customer-001',
      請求書番号: 'INV-LEGACY-20240115-001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 110000,
      税金額: 10000,
      ステータス: '送付済',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '2024年1月分サービス料金',
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

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })
    ).rejects.toThrow(NewInvoiceNotFoundError);
  });
});
