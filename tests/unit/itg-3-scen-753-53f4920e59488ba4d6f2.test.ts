import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-753: 自動同期が決定された場合、推定実行時間と優先度が指示に含まれる', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy details with auto sync decision', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionRecord = {
      id: discrepancyId,
      差異ID: discrepancyId,
      旧システム請求書ID: 'LEGACY-2025-001',
      新システム請求書ID: 'NEW-2025-001',
      差異種類: '金額差異',
      差異内容: '請求金額の不一致',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '消費税計算誤り',
      許容範囲判定: '範囲外',
      判定日時: '2025-01-15T10:35:00Z',
      判定者: 'user-001',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:35:00Z',
    };

    const legacyInvoiceRecord = {
      id: 'legacy-record-001',
      請求書ID: 'LEGACY-2025-001',
      ユーザーID: 'customer-001',
      請求書番号: 'LG-2025-000001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '確定',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: 'システム移行前の請求',
      作成日時: '2025-01-10T09:00:00Z',
      更新日時: '2025-01-10T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
    };

    const newInvoiceRecord = {
      id: 'new-record-001',
      請求書ID: 'NEW-2025-001',
      請求書番号: 'NEW-2025-000001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 950000,
      税金額: 95000,
      ステータス: '確定',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: 'システム移行後の請求',
    };

    const correctionTrackingRecord = {
      id: 'correction-001',
      是正ID: 'correction-001',
      差異ID: discrepancyId,
      是正方法: '自動同期',
      是正ステータス: '決定',
      是正実行者: 'system-user',
      是正実行日時: '2025-01-15T11:00:00Z',
      是正前データ: JSON.stringify({ 請求金額: 950000 }),
      是正後データ: JSON.stringify({ 請求金額: 1000000 }),
      検証結果: '成功',
      createdAt: '2025-01-15T11:00:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    };

    const confirmationHistoryRecord = {
      id: 'confirmation-001',
      確認ID: 'confirmation-001',
      差異ID: discrepancyId,
      確認ユーザーID: 'manager-001',
      確認日時: '2025-01-15T10:45:00Z',
      確認内容: '消費税計算誤りを確認。自動同期を承認。',
      判定結果: '承認',
      createdAt: '2025-01-15T10:45:00Z',
      updatedAt: '2025-01-15T10:45:00Z',
    };

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve([discrepancyDetectionRecord]);
      if (tableName === '旧システム請求書') return Promise.resolve([legacyInvoiceRecord]);
      if (tableName === '新システム請求書') return Promise.resolve([newInvoiceRecord]);
      if (tableName === '是正追跡管理履歴') return Promise.resolve([correctionTrackingRecord]);
      if (tableName === '差異確認履歴') return Promise.resolve([confirmationHistoryRecord]);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection.重大度).toBe('高');
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].是正方法).toBe('自動同期');
    expect(result.correctionTrackingHistory[0].是正ステータス).toBe('決定');
    expect(result.correctionTrackingHistory[0].是正実行日時).toBe('2025-01-15T11:00:00Z');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].判定結果).toBe('承認');
    expect(result.confirmationHistory[0].確認日時).toBe('2025-01-15T10:45:00Z');
    expect(result.legacySystemInvoice?.請求金額).toBe(1000000);
    expect(result.legacySystemInvoice?.税金額).toBe(100000);
    expect(result.legacySystemInvoice?.ステータス).toBe('確定');
    expect(result.newSystemInvoice?.請求金額).toBe(950000);
    expect(result.newSystemInvoice?.税金額).toBe(95000);
    expect(result.newSystemInvoice?.ステータス).toBe('確定');
  });
});
