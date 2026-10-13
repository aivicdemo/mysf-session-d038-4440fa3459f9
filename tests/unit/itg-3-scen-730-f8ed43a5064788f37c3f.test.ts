import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-730: 差異検出時の重大度別エスカレーションと是正指示', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('差異が検出された状態で、詳細情報取得から重大度別エスカレーション判定まで一連の処理が順にたどられ、最終的に是正追跡記録として保存される', async () => {
    const discrepancyData = [
      {
        id: 'diff-uuid-12345678-1234-1234-1234-123456789012',
        差異ID: 'diff-uuid-12345678-1234-1234-1234-123456789012',
        旧システム請求書ID: 'legacy-inv-20250101-001',
        新システム請求書ID: 'new-inv-20250101-001',
        差異種類: '金額差異',
        差異内容: '請求金額に1000円の差異が検出されました',
        金額差異: 1000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T09:30:00Z',
        重大度: 'HIGH',
        原因分類: '税計算誤り',
        許容範囲判定: 'OUT_OF_RANGE',
        判定日時: '2025-01-15T09:35:00Z',
        判定者: 'user-uuid-judge-001',
        createdAt: '2025-01-15T09:30:00Z',
        updatedAt: '2025-01-15T09:35:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-inv-uuid-001',
        請求書ID: 'legacy-inv-20250101-001',
        ユーザーID: 'customer-001',
        請求書番号: 'LEG-2025-0001',
        請求日: '2025-01-01T00:00:00Z',
        請求金額: 110000,
        税金額: 10000,
        ステータス: '送付済',
        支払期限日: '2025-02-01T00:00:00Z',
        摘要: '2025年1月分システム利用料',
        作成日時: '2025-01-01T08:00:00Z',
        更新日時: '2025-01-01T08:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2025-01-01T08:00:00Z',
        updatedAt: '2025-01-01T08:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-inv-uuid-001',
        請求書ID: 'new-inv-20250101-001',
        請求書番号: 'NEW-2025-0001',
        請求日: '2025-01-01T00:00:00Z',
        請求金額: 109000,
        税金額: 9000,
        ステータス: '送付済',
        支払期限日: '2025-02-01T00:00:00Z',
        摘要: '2025年1月分システム利用料',
        createdAt: '2025-01-01T08:00:00Z',
        updatedAt: '2025-01-01T08:00:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'correction-uuid-001',
        是正ID: 'correction-uuid-001',
        差異ID: 'diff-uuid-12345678-1234-1234-1234-123456789012',
        是正方法: 'システム設定修正',
        是正ステータス: '完了',
        是正実行者: 'user-uuid-corrector-001',
        是正実行日時: '2025-01-15T14:20:00Z',
        是正前データ: '{"請求金額": 110000, "税金額": 10000}',
        是正後データ: '{"請求金額": 109000, "税金額": 9000}',
        検証結果: '一致',
        createdAt: '2025-01-15T14:20:00Z',
        updatedAt: '2025-01-15T14:25:00Z',
      },
    ];

    const confirmationHistoryData = [
      {
        id: 'confirmation-uuid-001',
        確認ID: 'confirmation-uuid-001',
        差異ID: 'diff-uuid-12345678-1234-1234-1234-123456789012',
        確認ユーザーID: 'user-uuid-reviewer-001',
        確認日時: '2025-01-15T11:00:00Z',
        確認内容: '税計算誤りが原因と判断。是正方法を承認',
        判定結果: '承認',
        createdAt: '2025-01-15T11:00:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionTrackingData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId: 'diff-uuid-12345678-1234-1234-1234-123456789012',
    });

    expect(result.discrepancyId).toBe('diff-uuid-12345678-1234-1234-1234-123456789012');

    expect(result.discrepancyDetection).toBeDefined();
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額に1000円の差異が検出されました');
    expect(result.discrepancyDetection.amountDifference).toBe(1000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2025-01-15T09:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('HIGH');
    expect(result.discrepancyDetection.causeClassification).toBe('税計算誤り');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('OUT_OF_RANGE');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2025-01-15T09:35:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('user-uuid-judge-001');

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice!.invoiceNumber).toBe('LEG-2025-0001');
    expect(result.legacySystemInvoice!.invoiceDate).toBe('2025-01-01T00:00:00Z');
    expect(result.legacySystemInvoice!.invoiceAmount).toBe(110000);
    expect(result.legacySystemInvoice!.taxAmount).toBe(10000);
    expect(result.legacySystemInvoice!.status).toBe('送付済');
    expect(result.legacySystemInvoice!.paymentDueDate).toBe('2025-02-01T00:00:00Z');
    expect(result.legacySystemInvoice!.remarks).toBe('2025年1月分システム利用料');

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice!.invoiceNumber).toBe('NEW-2025-0001');
    expect(result.newSystemInvoice!.invoiceDate).toBe('2025-01-01T00:00:00Z');
    expect(result.newSystemInvoice!.invoiceAmount).toBe(109000);
    expect(result.newSystemInvoice!.taxAmount).toBe(9000);
    expect(result.newSystemInvoice!.status).toBe('送付済');
    expect(result.newSystemInvoice!.paymentDueDate).toBe('2025-02-01T00:00:00Z');
    expect(result.newSystemInvoice!.remarks).toBe('2025年1月分システム利用料');

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('システム設定修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-uuid-corrector-001');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2025-01-15T14:20:00Z');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('一致');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-uuid-reviewer-001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2025-01-15T11:00:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('税計算誤りが原因と判断。是正方法を承認');
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
