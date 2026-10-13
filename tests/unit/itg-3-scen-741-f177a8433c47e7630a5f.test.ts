import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-741: 月次締め日まで3営業日以内に「中」の重大度が判定された場合、重大度が「高」に上げられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検出日時から月次締め日までが3営業日以内で、重大度が「中」の場合、重大度が「高」に昇格される', async () => {
    const discrepancyId = 'diff-123e4567-e89b-12d3-a456-426614174000';

    const mockDiscrepancyData = {
      id: 'diff-123e4567-e89b-12d3-a456-426614174000',
      差異ID: 'diff-123e4567-e89b-12d3-a456-426614174000',
      旧システム請求書ID: 'legacy-inv-2025-001',
      新システム請求書ID: 'new-inv-2025-001',
      差異種類: '金額差異',
      差異内容: '請求金額に100円の差異を検出',
      金額差異: 100,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-28T10:00:00Z',
      重大度: '高',
      原因分類: '丸め誤差',
      許容範囲判定: '範囲外',
      判定日時: '2025-01-28T10:15:00Z',
      判定者: 'user-uuid-12345',
      createdAt: '2025-01-28T10:00:00Z',
      updatedAt: '2025-01-28T10:15:00Z',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-2025-001',
      請求書ID: 'legacy-inv-2025-001',
      ユーザーID: 'cust-001',
      請求書番号: 'LG-2025-001',
      請求日: '2025-01-20T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '未支払',
      支払期限日: '2025-02-28T00:00:00Z',
      摘要: '商品A販売代金',
      作成日時: '2025-01-20T09:00:00Z',
      更新日時: '2025-01-20T09:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
      createdAt: '2025-01-20T09:00:00Z',
      updatedAt: '2025-01-20T09:00:00Z',
    };

    const mockNewInvoice = {
      id: 'new-inv-2025-001',
      請求書ID: 'new-inv-2025-001',
      請求書番号: 'NU-2025-001',
      請求日: '2025-01-20T00:00:00Z',
      請求金額: 100100,
      税金額: 10010,
      ステータス: '未支払',
      支払期限日: '2025-02-28T00:00:00Z',
      摘要: '商品A販売代金',
      createdAt: '2025-01-20T09:00:00Z',
      updatedAt: '2025-01-20T09:00:00Z',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyData]) // 差異検出結果テーブル
      .mockResolvedValueOnce([mockLegacyInvoice]) // 旧システム請求書テーブル
      .mockResolvedValueOnce([mockNewInvoice]) // 新システム請求書テーブル
      .mockResolvedValueOnce([]) // 是正追跡管理履歴
      .mockResolvedValueOnce([]); // 差異確認履歴

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-123e4567-e89b-12d3-a456-426614174000');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-123e4567-e89b-12d3-a456-426614174000');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.amountDifference).toBe(100);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
