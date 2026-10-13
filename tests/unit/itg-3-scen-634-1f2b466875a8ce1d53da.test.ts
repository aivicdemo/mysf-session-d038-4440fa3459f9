import { jest } from '@jest/globals';
import { retrieveDiscrepancyDetailsForConfirmation, LegacyInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-634: 旧システムの請求データが空またはnullの場合、検証を中止してエラーを出力', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システム請求書データが見つからない場合、LegacyInvoiceNotFoundError エラーを発生させる', async () => {
    // 差異検出結果テーブルの内容
    const discrepancyDetectionData = [
      {
        差異ID: 'diff-634-001',
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '金額差異',
        差異内容: '請求金額が一致しない',
        金額差異: 10000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:00:00Z',
        重大度: '高',
        原因分類: '未分類',
        許容範囲判定: '許容外',
        判定日時: '2025-01-15T10:30:00Z',
        判定者: 'user-001',
      },
    ];

    // 旧システム請求書データが空配列
    const legacyInvoiceData: any[] = [];

    // 新システム請求書データ
    const newInvoiceData = [
      {
        請求書ID: 'new-inv-001',
        請求書番号: 'NEW-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '未払い',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'テスト請求書',
      },
    ];

    // 是正追跡管理履歴が空配列
    const correctionTrackingData: any[] = [];

    // 差異確認履歴が空配列
    const confirmationHistoryData: any[] = [];

    // データストアのモック設定
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionTrackingData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      return Promise.resolve([]);
    });

    // 処理を実行して LegacyInvoiceNotFoundError エラーが発生し、
    // エラーメッセージが「旧システム請求書データが見つかりません。」であることを確認
    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId: 'diff-634-001',
      }),
    ).rejects.toThrow('旧システム請求書データが見つかりません。');
  });
});
