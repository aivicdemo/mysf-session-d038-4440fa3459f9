import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-752: 手動修正が決定された場合、推定実行時間と優先度が指示に含まれる', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy details with manual correction decision', async () => {
    const discrepancyId = 'diff-2024-001';

    const discrepancyDetectionRecord = {
      id: discrepancyId,
      差異ID: discrepancyId,
      旧システム請求書ID: 'legacy-inv-2024-100',
      新システム請求書ID: 'new-inv-2024-100',
      差異種類: '金額差異',
      差異内容: '請求金額の不一致',
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'システム連携エラー',
      許容範囲判定: '範囲外',
      判定日時: '2024-01-15T11:00:00Z',
      判定者: 'user-judge-001',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    };

    const legacyInvoiceRecord = {
      id: 'legacy-inv-2024-100',
      請求書ID: 'legacy-inv-2024-100',
      ユーザーID: 'user-legacy-001',
      請求書番号: 'LEG-2024-100',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '確定',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: 'システムA請求',
      作成日時: '2024-01-10T09:00:00Z',
      更新日時: '2024-01-10T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
    };

    const newInvoiceRecord = {
      id: 'new-inv-2024-100',
      請求書ID: 'new-inv-2024-100',
      請求書番号: 'NEW-2024-100',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 950000,
      税金額: 95000,
      ステータス: '確定',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: 'システムB請求',
    };

    const correctionTrackingRecord = {
      id: 'correction-001',
      是正ID: 'correction-001',
      差異ID: discrepancyId,
      是正方法: '手動修正',
      是正ステータス: '実行予定',
      是正実行者: 'user-corrector-001',
      是正実行日時: null,
      是正前データ: JSON.stringify({ 請求金額: 950000 }),
      是正後データ: null,
      検証結果: null,
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z',
    };

    const confirmationHistoryRecord = {
      id: 'confirm-001',
      確認ID: 'confirm-001',
      差異ID: discrepancyId,
      確認ユーザーID: 'user-confirm-001',
      確認日時: '2024-01-15T13:30:00Z',
      確認内容: '手動修正で対応することを決定',
      判定結果: '手動修正決定',
      createdAt: '2024-01-15T13:30:00Z',
      updatedAt: '2024-01-15T13:30:00Z',
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
    expect(result.discrepancyDetection.差異内容).toBe('請求金額の不一致');
    expect(result.discrepancyDetection.金額差異).toBe(50000);
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].是正方法).toBe('手動修正');
    expect(result.correctionTrackingHistory[0].是正ステータス).toBe('実行予定');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].判定結果).toBe('手動修正決定');
    expect(result.confirmationHistory[0].確認内容).toBe('手動修正で対応することを決定');
    expect(result.legacySystemInvoice?.請求書番号).toBe('LEG-2024-100');
    expect(result.legacySystemInvoice?.請求金額).toBe(1000000);
    expect(result.newSystemInvoice?.請求書番号).toBe('NEW-2024-100');
    expect(result.newSystemInvoice?.請求金額).toBe(950000);
  });
});
