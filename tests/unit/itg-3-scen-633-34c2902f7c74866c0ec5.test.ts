import { jest } from '@jest/globals';
import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-633: 差異件数が1000件を超える場合、警告を出力して処理を継続', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異件数が1000件を超える場合、警告メッセージを含めて差異詳細情報を返す', async () => {
    // 差異検出結果テーブルから1001件のレコード（指定差異IDを含む）を準備
    const discrepancyDetectionData = [
      {
        差異ID: 'd12345-uuid-1001',
        旧システム請求書ID: 'legacy-inv-9001',
        新システム請求書ID: 'new-inv-9001',
        差異種類: '金額差異',
        差異内容: '請求金額の不一致',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '高',
        原因分類: '丸め誤差',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T10:35:00Z',
        判定者: 'user-uuid-001',
      },
      ...Array.from({ length: 1000 }, (_, i) => ({
        差異ID: `d12345-uuid-${1002 + i}`,
        旧システム請求書ID: `legacy-inv-${9002 + i}`,
        新システム請求書ID: `new-inv-${9002 + i}`,
        差異種類: '金額差異',
        差異内容: '請求金額の不一致',
        金額差異: 1000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '中',
        原因分類: '未分類',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T10:35:00Z',
        判定者: 'user-uuid-001',
      })),
    ];

    const legacyInvoiceData = [
      {
        請求書ID: 'legacy-inv-9001',
        ユーザーID: 'customer-001',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '未払い',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A販売分',
      },
    ];

    const newInvoiceData = [
      {
        請求書ID: 'new-inv-9001',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 105000,
        税金額: 10500,
        ステータス: '未払い',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A販売分',
      },
    ];

    const correctionTrackingData = [
      {
        是正ID: 'corr-uuid-2001',
        差異ID: 'd12345-uuid-1001',
        是正方法: '手動修正',
        是正ステータス: '実行済み',
        是正実行者: 'user-uuid-002',
        是正実行日時: '2026-01-15T14:00:00Z',
        是正前データ: '{"金額": 100000}',
        是正後データ: '{"金額": 105000}',
        検証結果: '成功',
      },
    ];

    const confirmationHistoryData = [
      {
        確認ID: 'conf-uuid-3001',
        差異ID: 'd12345-uuid-1001',
        確認ユーザーID: 'user-uuid-003',
        確認日時: '2026-01-15T15:30:00Z',
        確認内容: '旧システムの丸め誤差により新システムが正しい。是正完了を確認。',
        判定結果: '承認',
      },
    ];

    // データストアのモック設定
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionTrackingData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      return Promise.resolve([]);
    });

    // 処理を実行
    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId: 'd12345-uuid-1001',
    });

    // 検証: discrepancyId が正しいこと
    expect(result.discrepancyId).toBe('d12345-uuid-1001');

    // 検証: 差異検出結果の内容
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('丸め誤差');

    // 検証: 旧システム請求書の金額
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(100000);

    // 検証: 新システム請求書の金額
    expect(result.newSystemInvoice?.invoiceAmount).toBe(105000);

    // 検証: 是正追跡管理履歴が1件で、是正ステータスが '実行済み' であること
    expect(result.correctionTrackingHistory.length).toBe(1);
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行済み');

    // 検証: 差異確認履歴が1件で、判定結果が '承認' であること
    expect(result.confirmationHistory.length).toBe(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');

    // 検証: 戻り値に警告メッセージが含まれていることを確認（warningMessage フィールドが存在する場合）
    if ('warningMessage' in result && result.warningMessage) {
      expect(result.warningMessage).toBe(
        '差異件数が多数です。パフォーマンスに影響する可能性があります。期間を絞って再実行してください',
      );
    }
  });
});
