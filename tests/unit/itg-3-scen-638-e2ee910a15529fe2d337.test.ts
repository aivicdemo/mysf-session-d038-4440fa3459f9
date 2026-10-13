import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-638: 旧新請求書を商談IDと請求日でマッチングして、金額・明細件数・ステータスを比較し、金額ズレ・件数不一致・ステータス不整合を検出できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy details with all related records including correction and confirmation history', async () => {
    const discrepancyId = 'diff-12345678-1234-1234-1234-123456789012';

    const discrepancyData = {
      id: 'diff-12345678-1234-1234-1234-123456789012',
      旧システム請求書ID: 'INV-OLD-2024-001',
      新システム請求書ID: 'INV-NEW-2024-001',
      差異種類: '金額_件数_ステータス',
      差異内容: '金額ズレ、明細件数不一致、ステータス不整合を検出',
      金額差異: 50000,
      件数差異: 2,
      ステータス差異: 'billing_vs_invoiced',
      検出日時: '2024-01-15T10:30:00Z',
      重大度: 'high',
      原因分類: 'data_migration_error',
      許容範囲判定: 'out_of_range',
      判定日時: '2024-01-15T10:35:00Z',
      判定者: 'user-uuid-001',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:35:00Z',
    };

    const legacyInvoiceData = {
      id: 'legacy-inv-uuid-001',
      請求書ID: 'INV-OLD-2024-001',
      ユーザーID: 'user-12345',
      請求書番号: '2024-OLD-00001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 1050000,
      税金額: 105000,
      ステータス: 'billing',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商談ID: DEAL-2024-001 / 旧システム',
      作成日時: '2024-01-10T08:00:00Z',
      更新日時: '2024-01-10T08:00:00Z',
      検証ステータス: 'pending',
      検証日時: null,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    };

    const newInvoiceData = {
      id: 'new-inv-uuid-001',
      請求書ID: 'INV-NEW-2024-001',
      請求書番号: '2024-NEW-00001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'invoiced',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商談ID: DEAL-2024-001 / 新システム',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
    };

    const correctionTrackingData = {
      id: 'correction-uuid-001',
      差異ID: 'diff-12345678-1234-1234-1234-123456789012',
      是正方法: 'manual_adjustment',
      是正ステータス: 'in_progress',
      是正実行者: 'user-uuid-002',
      是正実行日時: '2024-01-15T11:00:00Z',
      是正前データ: '{"金額": 1050000, "件数": 12, "ステータス": "billing"}',
      是正後データ: '{"金額": 1000000, "件数": 10, "ステータス": "invoiced"}',
      検証結果: 'pending',
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    };

    const confirmationHistoryData = {
      id: 'confirm-uuid-001',
      差異ID: 'diff-12345678-1234-1234-1234-123456789012',
      確認ユーザーID: 'user-uuid-003',
      確認日時: '2024-01-15T14:00:00Z',
      確認内容: '旧新請求書を商談IDと請求日でマッチングし、金額ズレ・件数不一致・ステータス不整合を確認',
      判定結果: 'confirmed',
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z',
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

    expect(result.discrepancyId).toBe('diff-12345678-1234-1234-1234-123456789012');
    expect(result.discrepancyDetection.差異種類).toBe('金額_件数_ステータス');
    expect(result.discrepancyDetection.差異内容).toBe('金額ズレ、明細件数不一致、ステータス不整合を検出');
    expect(result.discrepancyDetection.金額差異).toBe(50000);
    expect(result.discrepancyDetection.件数差異).toBe(2);
    expect(result.discrepancyDetection.ステータス差異).toBe('billing_vs_invoiced');
    expect(result.discrepancyDetection.重大度).toBe('high');
    expect(result.discrepancyDetection.原因分類).toBe('data_migration_error');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('2024-OLD-00001');
    expect(result.legacySystemInvoice?.invoiceDate).toBe('2024-01-10T00:00:00Z');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1050000);
    expect(result.legacySystemInvoice?.status).toBe('billing');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('2024-NEW-00001');
    expect(result.newSystemInvoice?.invoiceDate).toBe('2024-01-10T00:00:00Z');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.status).toBe('invoiced');
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('manual_adjustment');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('in_progress');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('confirmed');
  });
});
