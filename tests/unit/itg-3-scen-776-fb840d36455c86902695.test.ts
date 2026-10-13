import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-776: 営業部門全体の目標売上が0円の場合、警告メッセージが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('重大度が警告の場合、正常に出力を返す', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const discrepancyDetectionData: any[] = [
      {
        id: 'diff-20250107-001',
        差異ID: 'diff-20250107-001',
        旧システム請求書ID: 'legacy-inv-2025-0001',
        新システム請求書ID: 'new-inv-2025-0001',
        差異種類: '営業目標金額',
        差異内容: '営業部門全体の目標売上が0円に設定されている。営業実績との突合ができません。',
        金額差異: 0,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-07T09:15:00Z',
        重大度: '警告',
        原因分類: 'データ入力エラー',
        許容範囲判定: '範囲外',
        判定日時: '2025-01-07T09:20:00Z',
        判定者: 'user-admin-001',
        createdAt: '2025-01-07T09:15:00Z',
        updatedAt: '2025-01-07T09:20:00Z',
      },
    ];

    const legacyInvoiceData: any[] = [
      {
        id: 'legacy-inv-2025-0001',
        請求書ID: 'legacy-inv-2025-0001',
        ユーザーID: 'sales-dept-001',
        請求書番号: 'INV-LEGACY-2025-001',
        請求日: '2025-01-01T00:00:00Z',
        請求金額: 5000000,
        税金額: 500000,
        ステータス: '確定',
        支払期限日: '2025-02-01T00:00:00Z',
        摘要: '営業部門目標売上',
        作成日時: '2024-12-28T10:00:00Z',
        更新日時: '2025-01-07T08:30:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2024-12-28T10:00:00Z',
        updatedAt: '2025-01-07T08:30:00Z',
      },
    ];

    const newInvoiceData: any[] = [
      {
        id: 'new-inv-2025-0001',
        請求書ID: 'new-inv-2025-0001',
        請求書番号: 'INV-NEW-2025-001',
        請求日: '2025-01-01T00:00:00Z',
        請求金額: 0,
        税金額: 0,
        ステータス: '確定',
        支払期限日: '2025-02-01T00:00:00Z',
        摘要: '営業部門目標売上',
        createdAt: '2024-12-28T10:00:00Z',
        updatedAt: '2025-01-07T08:30:00Z',
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

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: 'diff-20250107-001' });

    expect(result.discrepancyId).toBe('diff-20250107-001');
    expect(result.discrepancyDetection.差異ID).toBe('diff-20250107-001');
    expect(result.discrepancyDetection.差異種類).toBe('営業目標金額');
    expect(result.discrepancyDetection.重大度).toBe('警告');
    expect(result.discrepancyDetection.差異内容).toContain('営業部門全体の目標売上が0円');
    expect(result.legacySystemInvoice?.請求書ID).toBe('legacy-inv-2025-0001');
    expect(result.legacySystemInvoice?.請求金額).toBe(5000000);
    expect(result.newSystemInvoice?.請求書ID).toBe('new-inv-2025-0001');
    expect(result.newSystemInvoice?.請求金額).toBe(0);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
