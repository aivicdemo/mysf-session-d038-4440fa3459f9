import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-732: 差異検出時の重大度別エスカレーションと是正指示 - 新システムのスナップショットが空', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('差異の詳細情報取得時に新システムのスナップショットが空の場合、エラーメッセージが返され処理が中断される', async () => {
    const discrepancyData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-20240101-001',
        新システム請求書ID: 'NEW-INV-20240101-001',
        差異種類: '金額差異',
        差異内容: '請求金額の不一致',
        金額差異: 10000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T10:30:00Z',
        重大度: '高',
        原因分類: '税計算ロジック差分',
        許容範囲判定: '不可',
        判定日時: '2024-01-15T11:00:00Z',
        判定者: 'user-001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-invoice-record-001',
        請求書ID: 'LEGACY-INV-20240101-001',
        ユーザーID: 'customer-001',
        請求書番号: 'L-2024-001',
        請求日: '2024-01-01T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '確定',
        支払期限日: '2024-02-01T00:00:00Z',
        摘要: '商品A販売',
        作成日時: '2024-01-01T09:00:00Z',
        更新日時: '2024-01-01T09:00:00Z',
        検証ステータス: '完了',
        検証日時: '2024-01-01T10:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve([]);
      if (tableName === '是正追跡管理') return Promise.resolve([]);
      if (tableName === '差異確認履歴') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow(NewInvoiceNotFoundError);

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      })
    ).rejects.toThrow('新システム請求書データが見つかりません。');
  });
});
