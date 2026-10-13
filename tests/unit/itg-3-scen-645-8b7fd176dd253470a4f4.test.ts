import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-645: 件数差分が5件以上、または金額差分が目標売上の1%以上、またはステータス不整合が10件以上の場合、リスク程度を「重大」と判定して即座に移行を一時停止し経営層に報告できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve critical discrepancy details when amount difference meets critical threshold', async () => {
    const discrepancyId = 'diff-12345-critical';

    const discrepancyData = {
      差異ID: 'diff-12345-critical',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差分',
      差異内容: '請求金額が不一致',
      金額差異: 150000,
      件数差異: 0,
      ステータス差異: '',
      検出日時: '2026-10-07T10:00:00Z',
      重大度: 'critical',
      原因分類: 'system_conversion_error',
      許容範囲判定: 'out_of_tolerance',
      判定日時: '2026-10-07T10:05:00Z',
      判定者: 'user-judge-001',
    };

    const legacyInvoiceData = {
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'LEG-2026-0001',
      請求日: '2026-09-01T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: 'issued',
      支払期限日: '2026-10-01T00:00:00Z',
      摘要: '旧システム請求書',
      作成日時: '2026-09-01T10:00:00Z',
      更新日時: '2026-09-01T10:00:00Z',
      検証ステータス: 'verified',
      検証日時: '2026-09-02T10:00:00Z',
    };

    const newInvoiceData = {
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-0001',
      請求日: '2026-09-01T00:00:00Z',
      請求金額: 850000,
      税金額: 85000,
      ステータス: 'issued',
      支払期限日: '2026-10-01T00:00:00Z',
      摘要: '新システム請求書',
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
        return Promise.resolve([]);
      }
      if (tableName === '差異確認履歴') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-12345-critical');
    expect(result.discrepancyDetection.金額差異).toBe(150000);
    expect(result.discrepancyDetection.件数差異).toBe(0);
    expect(result.discrepancyDetection.ステータス差異).toBe('');
    expect(result.discrepancyDetection.重大度).toBe('critical');
    expect(result.discrepancyDetection.原因分類).toBe('system_conversion_error');
    expect(result.discrepancyDetection.許容範囲判定).toBe('out_of_tolerance');
    expect(result.legacySystemInvoice?.請求書ID).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.legacySystemInvoice?.status).toBe('issued');
    expect(result.newSystemInvoice?.請求書ID).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(850000);
    expect(result.newSystemInvoice?.status).toBe('issued');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
