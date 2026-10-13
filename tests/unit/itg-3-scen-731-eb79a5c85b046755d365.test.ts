import { retrieveDiscrepancyDetailsForConfirmation, LegacyInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-731: 差異検出時の重大度別エスカレーションと是正指示 - 旧システムのスナップショットが空', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('差異の詳細情報取得時に既存システムのスナップショットが空の場合、エラーメッセージが返され処理が中断される', async () => {
    const discrepancyData = [
      {
        差異ID: 'd4f8c9e2-1a5b-4c7d-9e3f-2b8a5c1d4e6f',
        旧システム請求書ID: 'legacy-inv-2024-001',
        新システム請求書ID: 'new-inv-2024-001',
        差異種類: '金額差異',
        差異内容: '請求金額が異なる',
        金額差異: 50000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T10:30:00Z',
        重大度: 'HIGH',
        原因分類: '計算誤り',
        許容範囲判定: 'false',
        判定日時: '2024-01-15T11:00:00Z',
        判定者: 'user-001',
      },
    ];

    const newInvoiceData = [
      {
        請求書ID: 'new-inv-2024-001',
        請求書番号: 'INV-2024-0001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 1500000,
        税金額: 150000,
        ステータス: 'issued',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: 'サービス提供分',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyData);
      if (tableName === '旧システム請求書') return Promise.resolve([]);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve([]);
      if (tableName === '差異確認履歴') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId: 'd4f8c9e2-1a5b-4c7d-9e3f-2b8a5c1d4e6f',
      })
    ).rejects.toThrow(LegacyInvoiceNotFoundError);

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId: 'd4f8c9e2-1a5b-4c7d-9e3f-2b8a5c1d4e6f',
      })
    ).rejects.toThrow('旧システム請求書データが見つかりません。');
  });
});
