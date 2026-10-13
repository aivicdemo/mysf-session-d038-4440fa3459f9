import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-775: 新システムのレコード件数が0件の場合、エラーメッセージが返されリスク評価が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム請求書データが空配列の場合、NewInvoiceNotFoundError を発生させる', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const discrepancyDetectionData: any[] = [
      {
        id: 'diff-12345-uuid',
        差異ID: 'diff-12345-uuid',
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '件数差異',
        差異内容: '新システムレコード件数が0件',
        金額差異: 0,
        件数差異: 1,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '高',
        原因分類: 'システム移行エラー',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T11:00:00Z',
        判定者: 'judge-user-uuid',
      },
    ];

    const legacyInvoiceData: any[] = [
      {
        id: 'legacy-inv-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-001',
        請求書番号: 'INV-2026-001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '確定',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: 'サービス提供',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: '完了',
        検証日時: '2026-01-10T14:00:00Z',
      },
    ];

    const newInvoiceData: any[] = [];

    mockDataStore.listRecords.mockImplementation(async (tableName: string) => {
      if (tableName === 'DiscrepancyDetection') return discrepancyDetectionData;
      if (tableName === 'LegacySystemInvoice') return legacyInvoiceData;
      if (tableName === 'NewSystemInvoice') return newInvoiceData;
      if (tableName === 'CorrectionTracking') return [];
      if (tableName === 'DiscrepancyConfirmation') return [];
      return [];
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId: 'diff-12345-uuid' })
    ).rejects.toThrow(NewInvoiceNotFoundError);
  });
});
