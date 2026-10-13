import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-631: 新システムのデータが空の場合、処理を中止して「新システムのデータが取得できません。データ抽出を再実行してください」エラーを出力できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム請求書IDが null の場合、NewInvoiceNotFoundError をスローする', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([
          {
            差異ID: 'diff-001',
            旧システム請求書ID: 'legacy-inv-001',
            新システム請求書ID: null,
            差異種類: '金額差異',
            差異内容: '請求金額が一致しない',
            金額差異: 10000,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2025-01-15T10:30:00Z',
            重大度: '高',
            原因分類: 'システム移行エラー',
            許容範囲判定: '許容範囲外',
            判定日時: '2025-01-15T11:00:00Z',
            判定者: 'user-judge-001',
          },
        ]);
      }
      if (tableName === '旧システム請求書') {
        return Promise.resolve([
          {
            請求書ID: 'legacy-inv-001',
            ユーザーID: 'user-cust-001',
            請求書番号: 'INV-2025-0001',
            請求日: '2025-01-10T00:00:00Z',
            請求金額: 100000,
            税金額: 10000,
            ステータス: '発行済み',
            支払期限日: '2025-02-10T00:00:00Z',
            摘要: '商品A販売',
            作成日時: '2025-01-10T09:00:00Z',
            更新日時: '2025-01-10T09:00:00Z',
            検証ステータス: '未検証',
            検証日時: null,
          },
        ]);
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
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: 'diff-001' })
    ).rejects.toThrow(NewInvoiceNotFoundError);
  });
});
