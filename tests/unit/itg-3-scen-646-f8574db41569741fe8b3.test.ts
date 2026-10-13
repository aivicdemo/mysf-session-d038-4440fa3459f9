import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-646: 件数差分が1～4件、または金額差分が0.1～1%未満、またはステータス不整合が1～9件の場合、リスク程度を「中程度」と判定して手作業検証を推奨できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy with correction tracking and confirmation history for medium risk', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      旧システム請求書ID: 'LEGACY-INV-001',
      新システム請求書ID: 'NEW-INV-001',
      差異種類: '複合差異',
      差異内容: '件数差分・金額差分・ステータス不整合が同時に検出',
      金額差異: 5000,
      件数差異: 3,
      ステータス差異: '5件',
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '中',
      原因分類: 'システム移行時データ変換エラー',
      許容範囲判定: '許容範囲外',
      判定日時: '2026-01-15T10:35:00Z',
      判定者: 'user-001',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:35:00Z',
    };

    const legacyInvoiceData = {
      id: 'legacy-rec-001',
      請求書ID: 'LEGACY-INV-001',
      ユーザーID: 'customer-001',
      請求書番号: 'LEGACY-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '未払い',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: 'システム移行前請求書',
      作成日時: '2026-01-10T09:00:00Z',
      更新日時: '2026-01-10T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-10T09:00:00Z',
    };

    const newInvoiceData = {
      id: 'new-rec-001',
      請求書ID: 'NEW-INV-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 995000,
      税金額: 99500,
      ステータス: '支払済み',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: 'システム移行後請求書',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
    };

    const correctionTrackingData = {
      id: 'correction-001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      是正方法: '手作業修正',
      是正ステータス: '未実行',
      是正実行者: null,
      是正実行日時: null,
      是正前データ: null,
      是正後データ: null,
      検証結果: null,
      createdAt: '2026-01-15T10:35:00Z',
      updatedAt: '2026-01-15T10:35:00Z',
    };

    const confirmationHistoryData = {
      id: 'confirmation-001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      確認ユーザーID: 'reviewer-001',
      確認日時: '2026-01-15T11:00:00Z',
      確認内容: '差異の詳細を確認し、件数差分3件・金額差分0.5%・ステータス不整合5件を検出',
      判定結果: '要検証',
      createdAt: '2026-01-15T11:00:00Z',
      updatedAt: '2026-01-15T11:00:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([discrepancyData]);
      }
      if (tableName === '旧システム請求書') {
        return Promise.resolve([legacyInvoiceData]);
      }
      if (tableName === '新システム請求書') {
        return Promise.resolve([newInvoiceData]);
      }
      if (tableName === '是正追跡管理') {
        return Promise.resolve([correctionTrackingData]);
      }
      if (tableName === '差異確認履歴') {
        return Promise.resolve([confirmationHistoryData]);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.差異種類).toBe('複合差異');
    expect(result.discrepancyDetection.金額差異).toBe(5000);
    expect(result.discrepancyDetection.件数差異).toBe(3);
    expect(result.discrepancyDetection.ステータス差異).toBe('5件');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEGACY-2026-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.legacySystemInvoice?.status).toBe('未払い');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2026-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(995000);
    expect(result.newSystemInvoice?.status).toBe('支払済み');
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('手作業修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('未実行');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('要検証');
  });
});
