import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-772: 検証結果が『警告』と判定された場合、validationStatusに『warning』が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('重大度がwarningの差異IDを検索し、すべての関連データを取得して返す', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440001';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        差異ID: '550e8400-e29b-41d4-a716-446655440001',
        旧システム請求書ID: 'INV-LEGACY-2025001',
        新システム請求書ID: 'INV-NEW-2025001',
        差異種類: '金額差異',
        差異内容: '請求金額が一致しません',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: 'warning',
        原因分類: '消費税計算ロジック差異',
        許容範囲判定: 'within_tolerance',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: '00000000-0000-0000-0000-000000000001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        請求書ID: 'INV-LEGACY-2025001',
        ユーザーID: 'USER-001',
        請求書番号: 'INV-2025-00001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 105000,
        税金額: 5000,
        ステータス: 'issued',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'サービス提供分',
        検証ステータス: 'verified',
        検証日時: '2025-01-10T09:00:00Z',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-10T09:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        請求書ID: 'INV-NEW-2025001',
        請求書番号: 'NW-2025-00001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'issued',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'サービス提供分',
      },
    ];

    const correctionData: any[] = [];

    const confirmationData: any[] = [];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationData);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.discrepancyDetection).toMatchObject({
      重大度: 'warning',
      差異種類: '金額差異',
      金額差異: 5000,
      検出日時: '2025-01-15T10:30:00Z',
      判定者: '00000000-0000-0000-0000-000000000001',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      請求書番号: 'INV-2025-00001',
      請求金額: 105000,
      税金額: 5000,
      ステータス: 'issued',
    });
    expect(result.newSystemInvoice).toMatchObject({
      請求書番号: 'NW-2025-00001',
      請求金額: 100000,
      税金額: 10000,
      ステータス: 'issued',
    });
    expect(result.correctionTrackingHistory).toHaveLength(0);
    expect(result.confirmationHistory).toHaveLength(0);
  });
});
