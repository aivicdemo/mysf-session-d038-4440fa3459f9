import { retrieveDiscrepancyDetailsForConfirmation, LegacyInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-642: 旧システムのレコード件数が0件の場合、リスク評価を中止して「旧システムのデータが取得できません。データ抽出を確認してください」エラーを出力できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LegacyInvoiceNotFoundError when legacy system invoice data is not found', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-2025-001',
      新システム請求書ID: 'NEW-2025-001',
      差異種類: '金額差異',
      差異内容: '請求金額の不一致',
      金額差異: 10000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'システム移行データ不整合',
      許容範囲判定: '範囲外',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'user-001',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    };

    const newInvoiceData = {
      id: 'NEW-2025-001',
      請求書ID: 'NEW-2025-001',
      請求書番号: 'INV-NEW-20250115-001',
      請求日: '2025-01-15T00:00:00Z',
      請求金額: 150000,
      税金額: 15000,
      ステータス: '確定',
      支払期限日: '2025-02-15T00:00:00Z',
      摘要: 'システム移行テスト',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([discrepancyData]);
      }
      if (tableName === '旧システム請求書') {
        return Promise.resolve([]);
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

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })
    ).rejects.toThrow(LegacyInvoiceNotFoundError);
  });
});
