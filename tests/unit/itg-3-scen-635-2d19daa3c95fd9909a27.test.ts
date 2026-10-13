import { jest } from '@jest/globals';
import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-635: 新システムの請求データが空またはnullの場合、検証を中止してエラーを出力', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム請求書データが見つからない場合、NewInvoiceNotFoundError エラーを発生させる', async () => {
    // 差異検出結果テーブルの内容（新システム請求書IDがnull）
    const discrepancyDetectionData = [
      {
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-001',
        新システム請求書ID: null,
        差異種類: '金額差異',
        差異内容: '請求金額が一致しない',
        金額差異: 50000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T09:30:00Z',
        重大度: '高',
        原因分類: '未分類',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T10:00:00Z',
        判定者: 'user-001',
      },
    ];

    // 旧システム請求書データ
    const legacyInvoiceData = [
      {
        請求書ID: 'LEGACY-INV-001',
        ユーザーID: 'user-123',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 1000000,
        税金額: 100000,
        ステータス: '未払い',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '2026年1月分請求',
      },
    ];

    // 新システム請求書データが null
    const newInvoiceData: null = null;

    // 是正追跡管理履歴が空配列
    const correctionTrackingData: any[] = [];

    // 差異確認履歴が空配列
    const confirmationHistoryData: any[] = [];

    // データストアのモック設定
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') {
        // 新システム請求書テーブルからデータが取得されない状態
        return Promise.resolve(newInvoiceData);
      }
      if (tableName === '是正追跡管理') return Promise.resolve(correctionTrackingData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      return Promise.resolve([]);
    });

    // 処理を実行して NewInvoiceNotFoundError エラーが発生し、
    // エラーメッセージが「新システム請求書データが見つかりません。」であることを確認
    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).rejects.toThrow('新システム請求書データが見つかりません。');
  });
});
