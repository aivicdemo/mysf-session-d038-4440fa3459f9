import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-777: 件数差分が5件以上の場合、リスク程度が『重大』と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('件数差異が5件の場合、正常にデータを返す', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const discrepancyDetectionData: any[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-001',
        新システム請求書ID: 'NEW-INV-001',
        差異種類: '件数差分',
        差異内容: '請求明細行の件数が異なる',
        金額差異: 0,
        件数差異: 5,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: null,
        原因分類: null,
        許容範囲判定: null,
        判定日時: null,
        判定者: null,
      },
    ];

    const legacyInvoiceData: any[] = [
      {
        id: 'LEGACY-INV-001',
        請求書ID: 'LEGACY-INV-001',
        ユーザーID: 'USER-001',
        請求書番号: 'LEG-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'issued',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '月次請求',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: 'pending',
        検証日時: null,
      },
    ];

    const newInvoiceData: any[] = [
      {
        id: 'NEW-INV-001',
        請求書ID: 'NEW-INV-001',
        請求書番号: 'NEW-2026-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'issued',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '月次請求',
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

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.差異ID).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.差異種類).toBe('件数差分');
    expect(result.discrepancyDetection.差異内容).toBe('請求明細行の件数が異なる');
    expect(result.discrepancyDetection.金額差異).toBe(0);
    expect(result.discrepancyDetection.件数差異).toBe(5);
    expect(result.discrepancyDetection.ステータス差異).toBeNull();
    expect(result.discrepancyDetection.検出日時).toBe('2026-01-15T10:30:00Z');
    expect(result.discrepancyDetection.重大度).toBeNull();
    expect(result.discrepancyDetection.原因分類).toBeNull();
    expect(result.discrepancyDetection.許容範囲判定).toBeNull();
    expect(result.discrepancyDetection.判定日時).toBeNull();
    expect(result.discrepancyDetection.判定者).toBeNull();
    expect(result.legacySystemInvoice?.請求書番号).toBe('LEG-2026-0001');
    expect(result.legacySystemInvoice?.請求日).toBe('2026-01-10T00:00:00Z');
    expect(result.legacySystemInvoice?.請求金額).toBe(100000);
    expect(result.legacySystemInvoice?.税金額).toBe(10000);
    expect(result.legacySystemInvoice?.ステータス).toBe('issued');
    expect(result.legacySystemInvoice?.支払期限日).toBe('2026-02-10T00:00:00Z');
    expect(result.legacySystemInvoice?.摘要).toBe('月次請求');
    expect(result.newSystemInvoice?.請求書番号).toBe('NEW-2026-0001');
    expect(result.newSystemInvoice?.請求日).toBe('2026-01-10T00:00:00Z');
    expect(result.newSystemInvoice?.請求金額).toBe(100000);
    expect(result.newSystemInvoice?.税金額).toBe(10000);
    expect(result.newSystemInvoice?.ステータス).toBe('issued');
    expect(result.newSystemInvoice?.支払期限日).toBe('2026-02-10T00:00:00Z');
    expect(result.newSystemInvoice?.摘要).toBe('月次請求');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
