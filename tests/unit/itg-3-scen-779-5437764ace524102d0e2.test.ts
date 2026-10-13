import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-779: ステータス不整合が10件以上の場合、リスク程度が『重大』と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ステータス差異が10件の場合、重大度『critical』で返す', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const discrepancyDetectionData: any[] = [
      {
        id: 'diff-uuid-001',
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: 'ステータス不整合',
        差異内容: 'ステータス値が一致しない',
        金額差異: 0,
        件数差異: 10,
        ステータス差異: 'pending|completed',
        検出日時: '2025-01-15T10:30:00Z',
        重大度: 'critical',
        原因分類: 'システム同期遅延',
        許容範囲判定: 'out_of_range',
        判定日時: '2025-01-15T10:35:00Z',
        判定者: 'user-uuid-001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:35:00Z',
      },
    ];

    const legacyInvoiceData: any[] = [
      {
        id: 'legacy-rec-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-001',
        請求書番号: 'LEG-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'pending',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'サンプル請求書',
        検証ステータス: 'unverified',
        検証日時: null,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-10T08:00:00Z',
      },
    ];

    const newInvoiceData: any[] = [
      {
        id: 'new-rec-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'NEW-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'completed',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'サンプル請求書',
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-10T09:00:00Z',
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

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: 'diff-uuid-001' });

    expect(result.discrepancyId).toBe('diff-uuid-001');
    expect(result.discrepancyDetection.件数差異).toBe(10);
    expect(result.discrepancyDetection.ステータス差異).toBe('pending|completed');
    expect(result.discrepancyDetection.重大度).toBe('critical');
  });
});
