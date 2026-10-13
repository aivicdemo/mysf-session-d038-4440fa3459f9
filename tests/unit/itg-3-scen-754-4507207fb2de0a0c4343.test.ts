import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-754: データ抽出時刻が旧新システムで5分以上異なる場合、警告メッセージが記録される', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record warning message when extraction time difference exceeds 5 minutes', async () => {
    const discrepancyId = 'diff-754-001';

    const discrepancyDetectionRecord = {
      id: discrepancyId,
      差異ID: discrepancyId,
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '抽出時刻差異',
      差異内容: '旧システム抽出時刻: 2026-01-15T10:00:00Z, 新システム抽出時刻: 2026-01-15T10:05:30Z',
      金額差異: 0,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:06:00Z',
      重大度: 'WARNING',
      原因分類: 'system_timing_deviation',
      許容範囲判定: 'outside_tolerance',
      判定日時: '2026-01-15T10:06:15Z',
      判定者: 'judge-user-001',
      createdAt: '2026-01-15T10:06:00Z',
      updatedAt: '2026-01-15T10:06:15Z',
    };

    const legacyInvoiceRecord = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-2026-0001',
      請求日: '2026-01-15T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'issued',
      支払期限日: '2026-02-15T00:00:00Z',
      摘要: 'January services',
      作成日時: '2026-01-15T09:55:00Z',
      更新日時: '2026-01-15T09:55:00Z',
      検証ステータス: 'pending',
      検証日時: null,
      createdAt: '2026-01-15T09:55:00Z',
      updatedAt: '2026-01-15T09:55:00Z',
    };

    const newInvoiceRecord = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'INV-2026-0001',
      請求日: '2026-01-15T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'issued',
      支払期限日: '2026-02-15T00:00:00Z',
      摘要: 'January services',
      createdAt: '2026-01-15T10:05:00Z',
      updatedAt: '2026-01-15T10:05:00Z',
    };

    const confirmationHistoryRecord = {
      id: 'confirm-754-001',
      確認ID: 'confirm-754-001',
      差異ID: discrepancyId,
      確認ユーザーID: 'reviewer-user-001',
      確認日時: '2026-01-15T10:06:45Z',
      確認内容: '抽出時刻の差異を確認。5分以上の差異が検出されたため、警告メッセージを記録することを了承。',
      判定結果: 'acknowledged',
      createdAt: '2026-01-15T10:06:45Z',
      updatedAt: '2026-01-15T10:06:45Z',
    };

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve([discrepancyDetectionRecord]);
      if (tableName === '旧システム請求書') return Promise.resolve([legacyInvoiceRecord]);
      if (tableName === '新システム請求書') return Promise.resolve([newInvoiceRecord]);
      if (tableName === '是正追跡管理履歴') return Promise.resolve([]);
      if (tableName === '差異確認履歴') return Promise.resolve([confirmationHistoryRecord]);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection.重大度).toBe('WARNING');
    expect(result.discrepancyDetection.差異内容).toContain('旧システム抽出時刻: 2026-01-15T10:00:00Z');
    expect(result.discrepancyDetection.差異内容).toContain('新システム抽出時刻: 2026-01-15T10:05:30Z');
    expect(result.legacySystemInvoice?.請求書ID).toBe('legacy-inv-001');
    expect(result.newSystemInvoice?.請求書ID).toBe('new-inv-001');
    expect(result.correctionTrackingHistory).toHaveLength(0);
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].確認内容).toContain('警告メッセージを記録');
  });
});
