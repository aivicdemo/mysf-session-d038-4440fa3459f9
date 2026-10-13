import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-773: 検証結果が『不合格』と判定された場合、validationStatusに『fail』が設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('重大度が高の差異IDを検索し、すべての関連データを取得して返す', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-2025-001',
        新システム請求書ID: 'NEW-INV-2025-001',
        差異種類: '金額差異',
        差異内容: '請求金額の不一致',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: '高',
        原因分類: 'データ入力誤り',
        許容範囲判定: '範囲外',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: 'user-uuid-001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-record-id-001',
        請求書ID: 'LEGACY-INV-2025-001',
        ユーザーID: 'customer-001',
        請求書番号: 'LEGACY-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '発行済み',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '2025年1月度請求',
        検証ステータス: 'fail',
        検証日時: '2025-01-15T11:30:00Z',
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-15T11:30:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-record-id-001',
        請求書ID: 'NEW-INV-2025-001',
        請求書番号: 'NEW-2025-001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 105000,
        税金額: 10500,
        ステータス: '発行済み',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '2025年1月度請求',
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-10T09:00:00Z',
      },
    ];

    const correctionData = [
      {
        id: 'correction-id-001',
        是正ID: 'correction-id-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: '手動修正',
        是正ステータス: '実行済み',
        是正実行者: 'user-uuid-002',
        是正実行日時: '2025-01-16T14:00:00Z',
        是正前データ: '{"請求金額": 105000}',
        是正後データ: '{"請求金額": 100000}',
        検証結果: 'fail',
        createdAt: '2025-01-16T14:00:00Z',
        updatedAt: '2025-01-16T14:00:00Z',
      },
    ];

    const confirmationData = [
      {
        id: 'confirmation-id-001',
        確認ID: 'confirmation-id-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-uuid-003',
        確認日時: '2025-01-16T15:30:00Z',
        確認内容: '金額差異を確認し、新システムの入力誤りと判定。是正が必要。',
        判定結果: 'fail',
        createdAt: '2025-01-16T15:30:00Z',
        updatedAt: '2025-01-16T15:30:00Z',
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
    expect(result.discrepancyDetection).toMatchObject({
      旧システム請求書ID: 'LEGACY-INV-2025-001',
      新システム請求書ID: 'NEW-INV-2025-001',
      差異種類: '金額差異',
      差異内容: '請求金額の不一致',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: 'データ入力誤り',
      許容範囲判定: '範囲外',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'user-uuid-001',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      請求書ID: 'LEGACY-INV-2025-001',
      請求書番号: 'LEGACY-2025-001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '発行済み',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '2025年1月度請求',
      検証ステータス: 'fail',
      検証日時: '2025-01-15T11:30:00Z',
    });
    expect(result.newSystemInvoice).toMatchObject({
      請求書ID: 'NEW-INV-2025-001',
      請求書番号: 'NEW-2025-001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 105000,
      税金額: 10500,
      ステータス: '発行済み',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '2025年1月度請求',
    });
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      是正ID: 'correction-id-001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      是正方法: '手動修正',
      是正ステータス: '実行済み',
      是正実行者: 'user-uuid-002',
      是正実行日時: '2025-01-16T14:00:00Z',
      是正前データ: '{"請求金額": 105000}',
      是正後データ: '{"請求金額": 100000}',
      検証結果: 'fail',
    });
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      確認ID: 'confirmation-id-001',
      差異ID: '550e8400-e29b-41d4-a716-446655440000',
      確認ユーザーID: 'user-uuid-003',
      確認日時: '2025-01-16T15:30:00Z',
      確認内容: '金額差異を確認し、新システムの入力誤りと判定。是正が必要。',
      判定結果: 'fail',
    });
  });
});
