import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-632: フィールドマッピング定義が不完全な場合、警告「一部のフィールドマッピング定義が不完全です。分析精度が低下する可能性があります」を出力して処理を継続できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('原因分類フィールドが null の場合、警告を出力して出力オブジェクトを返す', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([
          {
            差異ID: 'discrepancy-001',
            旧システム請求書ID: 'legacy-inv-001',
            新システム請求書ID: 'new-inv-001',
            差異種類: '金額差異',
            差異内容: '請求金額が一致しません',
            金額差異: 1000,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2026-10-01T10:00:00Z',
            重大度: '高',
            原因分類: null,
            許容範囲判定: '超過',
            判定日時: '2026-10-01T11:00:00Z',
            判定者: 'user-001',
          },
        ]);
      }
      if (tableName === '旧システム請求書') {
        return Promise.resolve([
          {
            請求書ID: 'legacy-inv-001',
            ユーザーID: 'user-001',
            請求書番号: 'LEG-2026-001',
            請求日: '2026-10-01T00:00:00Z',
            請求金額: 100000,
            税金額: 10000,
            ステータス: '確定',
            支払期限日: '2026-10-31T00:00:00Z',
            摘要: '商品A販売',
            作成日時: '2026-10-01T09:00:00Z',
            更新日時: '2026-10-01T09:00:00Z',
            検証ステータス: '未検証',
            検証日時: null,
          },
        ]);
      }
      if (tableName === '新システム請求書') {
        return Promise.resolve([
          {
            請求書ID: 'new-inv-001',
            請求書番号: 'NEW-2026-001',
            請求日: '2026-10-01T00:00:00Z',
            請求金額: 101000,
            税金額: 10100,
            ステータス: '確定',
            支払期限日: '2026-10-31T00:00:00Z',
            摘要: '商品A販売',
            ユーザーID: null,
            作成日時: null,
            更新日時: null,
            検証ステータス: null,
            検証日時: null,
          },
        ]);
      }
      if (tableName === '是正追跡管理') {
        return Promise.resolve([
          {
            是正ID: 'correction-001',
            差異ID: 'discrepancy-001',
            是正方法: '手動調整',
            是正ステータス: '完了',
            是正実行者: 'user-002',
            是正実行日時: '2026-10-02T09:00:00Z',
            是正前データ: '{"金額":101000}',
            是正後データ: '{"金額":100000}',
            検証結果: '成功',
          },
        ]);
      }
      if (tableName === '差異確認履歴') {
        return Promise.resolve([
          {
            確認ID: 'confirm-001',
            差異ID: 'discrepancy-001',
            確認ユーザーID: 'user-003',
            確認日時: '2026-10-02T14:00:00Z',
            確認内容: '是正内容を確認し、問題なしと判定',
            判定結果: '承認',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: 'discrepancy-001' });

    expect(result).toBeDefined();
    expect(result.discrepancyId).toBe('discrepancy-001');

    expect(result.discrepancyDetection).toBeDefined();
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額が一致しません');
    expect(result.discrepancyDetection.amountDifference).toBe(1000);
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBeNull();
    expect(result.discrepancyDetection.toleranceJudgment).toBe('超過');

    expect(result.legacySystemInvoice).toBeDefined();
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2026-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(100000);

    expect(result.newSystemInvoice).toBeDefined();
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2026-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(101000);

    expect(result.correctionTrackingHistory).toBeDefined();
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.confirmationHistory).toBeDefined();
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
