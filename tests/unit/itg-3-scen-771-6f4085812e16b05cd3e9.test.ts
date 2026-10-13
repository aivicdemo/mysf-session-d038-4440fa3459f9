import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-771: 検証結果が『完全一致』と判定された場合、validationStatusに『pass』が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('許容範囲判定が完全一致の差異IDを検索し、すべての関連データを取得して返す', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'INV-OLD-001',
        新システム請求書ID: 'INV-NEW-001',
        差異種類: '金額差異',
        差異内容: '請求金額が一致している',
        金額差異: 0,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: '低',
        原因分類: 'なし',
        許容範囲判定: '完全一致',
        判定日時: '2025-01-15T10:35:00Z',
        判定者: 'user-001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:35:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-inv-001',
        請求書ID: 'INV-OLD-001',
        ユーザーID: 'user-cust-001',
        請求書番号: 'OLD-INV-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '発行済み',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'サービス提供料金',
        検証ステータス: '完全一致',
        検証日時: '2025-01-15T10:35:00Z',
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-15T10:35:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-inv-001',
        請求書ID: 'INV-NEW-001',
        請求書番号: 'NEW-INV-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '発行済み',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: 'サービス提供料金',
      },
    ];

    const correctionData: any[] = [];

    const confirmationData = [
      {
        id: 'conf-001',
        確認ID: 'conf-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-001',
        確認日時: '2025-01-15T11:00:00Z',
        確認内容: '検証結果を確認しました',
        判定結果: 'pass',
        createdAt: '2025-01-15T11:00:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationData);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.許容範囲判定).toBe('完全一致');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.請求金額).toBe(100000);
    expect(result.legacySystemInvoice?.ステータス).toBe('発行済み');
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.請求金額).toBe(100000);
    expect(result.newSystemInvoice?.ステータス).toBe('発行済み');
    expect(result.correctionTrackingHistory).toHaveLength(0);
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].判定結果).toBe('pass');
  });
});
