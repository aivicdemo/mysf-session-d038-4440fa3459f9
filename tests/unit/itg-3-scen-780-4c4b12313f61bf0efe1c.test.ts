import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-780: 件数差分が1～4件の場合、リスク程度が『中程度』と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('件数差異が3件の場合、重大度『中程度』で返す', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const discrepancyDetectionData: any[] = [
      {
        id: 'diff-12345-uuid',
        差異ID: 'diff-12345-uuid',
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '件数差異',
        差異内容: '請求明細行数が異なる',
        金額差異: 0,
        件数差異: 3,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '中程度',
        原因分類: 'データ移行エラー',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T10:35:00Z',
        判定者: 'user-uuid-001',
      },
    ];

    const legacyInvoiceData: any[] = [
      {
        id: 'legacy-inv-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'customer-001',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 150000,
        税金額: 15000,
        ステータス: '請求済み',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A・商品B・商品C',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
      },
    ];

    const newInvoiceData: any[] = [
      {
        id: 'new-inv-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'INV-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 150000,
        税金額: 15000,
        ステータス: '請求済み',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A・商品B',
      },
    ];

    mockDataStore.listRecords.mockImplementation(async (tableName: string) => {
      if (tableName === 'DiscrepancyDetection') return discrepancyDetectionData;
      if (tableName === 'LegacySystemInvoice') return legacyInvoiceData;
      if (tableName === 'NewSystemInvoice') return newInvoiceData;
      if (tableName === 'CorrectionTracking') return [];
      if (tableName === 'DiscrepancyConfirmation') return [];
      return [];
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: 'diff-12345-uuid' });

    expect(result.discrepancyId).toBe('diff-12345-uuid');
    expect(result.discrepancyDetection.差異ID).toBe('diff-12345-uuid');
    expect(result.discrepancyDetection.件数差異).toBe(3);
    expect(result.discrepancyDetection.重大度).toBe('中程度');
    expect(result.discrepancyDetection.差異内容).toBe('請求明細行数が異なる');
    expect(result.legacySystemInvoice?.請求書ID).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.請求書番号).toBe('INV-2026-0001');
    expect(result.legacySystemInvoice?.請求金額).toBe(150000);
    expect(result.newSystemInvoice?.請求書ID).toBe('new-inv-001');
    expect(result.newSystemInvoice?.請求書番号).toBe('INV-2026-0001');
    expect(result.newSystemInvoice?.請求金額).toBe(150000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
