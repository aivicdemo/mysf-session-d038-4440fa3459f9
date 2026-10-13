import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-740: ステータス不整合のみで金額ズレがない場合、重大度が「中」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果にステータス不整合のみがあり、金額差異が0の場合、重大度が「中」として返される', async () => {
    const discrepancyId = 'diff-001';

    const mockDiscrepancyData = {
      id: 'diff-001',
      差異ID: 'diff-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: 'ステータス不整合',
      差異内容: '旧システムステータス：請求済み、新システムステータス：未請求',
      金額差異: 0,
      件数差異: 0,
      ステータス差異: '請求済み|未請求',
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '中',
      原因分類: 'システムデータ同期遅延',
      許容範囲判定: '範囲外',
      判定日時: '2026-01-15T10:35:00Z',
      判定者: 'user-001',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:35:00Z',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'customer-001',
      請求書番号: 'LEGACY-2026-00001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '請求済み',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '商品A販売',
      作成日時: '2026-01-10T09:00:00Z',
      更新日時: '2026-01-15T10:00:00Z',
      検証ステータス: '検証済み',
      検証日時: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    };

    const mockNewInvoice = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-00001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '未請求',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '商品A販売',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-15T09:30:00Z',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyData]) // 差異検出結果テーブル
      .mockResolvedValueOnce([mockLegacyInvoice]) // 旧システム請求書テーブル
      .mockResolvedValueOnce([mockNewInvoice]) // 新システム請求書テーブル
      .mockResolvedValueOnce([]) // 是正追跡管理履歴
      .mockResolvedValueOnce([]); // 差異確認履歴

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.severity).toBe('中');
    expect(result.discrepancyDetection.amountDifference).toBe(0);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBe('請求済み|未請求');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
