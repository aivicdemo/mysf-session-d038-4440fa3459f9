import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-778: 金額差分が目標売上の1%以上の場合、リスク程度が『重大』と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差異が旧システム請求金額の1%の場合、重大度『重大』で返す', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const discrepancyDetectionData: any[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-2024-001',
        新システム請求書ID: 'NEW-INV-2024-001',
        差異種類: '金額差異',
        差異内容: '請求金額が一致していない',
        金額差異: 15000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T10:30:00Z',
        重大度: '重大',
        原因分類: '消費税計算エラー',
        許容範囲判定: '範囲外',
        判定日時: '2024-01-15T10:35:00Z',
        判定者: 'a0000000-0000-0000-0000-000000000001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
      },
    ];

    const legacyInvoiceData: any[] = [
      {
        id: 'LEGACY-INV-2024-001',
        請求書ID: 'LEGACY-INV-2024-001',
        ユーザーID: 'USER-001',
        請求書番号: 'INV-20240115-001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 1500000,
        税金額: 150000,
        ステータス: '請求済み',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: '2024年1月度売上請求',
        作成日時: '2024-01-10T09:00:00Z',
        更新日時: '2024-01-10T09:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
      },
    ];

    const newInvoiceData: any[] = [
      {
        id: 'NEW-INV-2024-001',
        請求書ID: 'NEW-INV-2024-001',
        請求書番号: 'INV-20240115-001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 1485000,
        税金額: 148500,
        ステータス: '請求済み',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: '2024年1月度売上請求',
        createdAt: '2024-01-10T09:05:00Z',
        updatedAt: '2024-01-10T09:05:00Z',
      },
    ];

    const correctionTrackingData: any[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        是正ID: '550e8400-e29b-41d4-a716-446655440001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: '手動修正',
        是正ステータス: '実行済み',
        是正実行者: 'a0000000-0000-0000-0000-000000000002',
        是正実行日時: '2024-01-16T14:20:00Z',
        是正前データ: '{"請求金額": 1500000, "税金額": 150000}',
        是正後データ: '{"請求金額": 1485000, "税金額": 148500}',
        検証結果: '完了',
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-16T14:20:00Z',
      },
    ];

    const confirmationHistoryData: any[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        確認ID: '550e8400-e29b-41d4-a716-446655440002',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'a0000000-0000-0000-0000-000000000003',
        確認日時: '2024-01-17T09:15:00Z',
        確認内容: '是正内容を確認し、対応を承認した',
        判定結果: '承認',
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-17T09:15:00Z',
      },
    ];

    mockDataStore.listRecords.mockImplementation(async (tableName: string) => {
      if (tableName === 'DiscrepancyDetection') return discrepancyDetectionData;
      if (tableName === 'LegacySystemInvoice') return legacyInvoiceData;
      if (tableName === 'NewSystemInvoice') return newInvoiceData;
      if (tableName === 'CorrectionTracking') return correctionTrackingData;
      if (tableName === 'DiscrepancyConfirmation') return confirmationHistoryData;
      return [];
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.重大度).toBe('重大');
    expect(result.legacySystemInvoice?.請求金額).toBe(1500000);
    expect(result.newSystemInvoice?.請求金額).toBe(1485000);
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].是正ステータス).toBe('実行済み');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].判定結果).toBe('承認');
  });
});
