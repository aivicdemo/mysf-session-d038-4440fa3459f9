import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-742: 差異の金額規模と件数が手動修正の閾値以下の場合、是正方法として「手動修正」が決定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差異が5000で件数差異が0の場合、正常に詳細情報が返される', async () => {
    const discrepancyId = 'diff-12345678-uuid';

    const mockDiscrepancyData = {
      id: 'diff-12345678-uuid',
      差異ID: 'diff-12345678-uuid',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額の不一致',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-10-07T10:00:00Z',
      重大度: '中',
      原因分類: '丸め誤差',
      許容範囲判定: '許容範囲内',
      判定日時: '2026-10-07T10:15:00Z',
      判定者: 'user-uuid-judge-001',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-legacy-001',
      請求書番号: 'LEG-2026-001',
      請求日: '2026-10-01T00:00:00Z',
      請求金額: 1005000,
      税金額: 100500,
      ステータス: 'issued',
      支払期限日: '2026-10-31T00:00:00Z',
      摘要: '2026年10月分請求',
    };

    const mockNewInvoice = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-10-01T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'issued',
      支払期限日: '2026-10-31T00:00:00Z',
      摘要: '2026年10月分請求',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyData]) // 差異検出結果テーブル
      .mockResolvedValueOnce([mockLegacyInvoice]) // 旧システム請求書テーブル
      .mockResolvedValueOnce([mockNewInvoice]) // 新システム請求書テーブル
      .mockResolvedValueOnce([]) // 是正追跡管理履歴
      .mockResolvedValueOnce([]); // 差異確認履歴

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-12345678-uuid');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-12345678-uuid');
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.severity).toBe('中');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1005000);
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
