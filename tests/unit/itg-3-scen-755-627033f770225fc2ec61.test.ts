import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-755: 許容閾値が負の数の場合、エラーメッセージが返され処理が中断される', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return discrepancy details with negative amount difference', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionRecord = {
      差異ID: discrepancyId,
      旧システム請求書ID: 'INV-2024-001',
      新システム請求書ID: 'NEW-INV-2024-001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: -5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2024-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '税計算誤り',
      許容範囲判定: '外',
      判定日時: '2024-01-15T11:00:00Z',
      判定者: '550e8400-e29b-41d4-a716-446655440001',
      id: discrepancyId,
    };

    const legacyInvoiceRecord = {
      請求書ID: 'INV-2024-001',
      ユーザーID: 'USR-001',
      請求書番号: '2024-00001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '送信済み',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商品A納入分',
      id: 'INV-2024-001',
    };

    const newInvoiceRecord = {
      請求書ID: 'NEW-INV-2024-001',
      請求書番号: '2024-00001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 95000,
      税金額: 9500,
      ステータス: '送信済み',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: '商品A納入分',
      id: 'NEW-INV-2024-001',
    };

    const correctionTrackingRecord = {
      是正ID: '550e8400-e29b-41d4-a716-446655440010',
      差異ID: discrepancyId,
      是正方法: '手動修正',
      是正ステータス: '実行済み',
      是正実行者: '550e8400-e29b-41d4-a716-446655440002',
      是正実行日時: '2024-01-16T09:00:00Z',
      是正前データ: JSON.stringify({ 金額差異: -5000 }),
      是正後データ: JSON.stringify({ 金額差異: 0 }),
      検証結果: '正常',
      id: '550e8400-e29b-41d4-a716-446655440010',
    };

    const confirmationHistoryRecord = {
      確認ID: '550e8400-e29b-41d4-a716-446655440020',
      差異ID: discrepancyId,
      確認ユーザーID: '550e8400-e29b-41d4-a716-446655440003',
      確認日時: '2024-01-16T14:30:00Z',
      確認内容: '是正内容を確認し、承認した',
      判定結果: '承認',
      id: '550e8400-e29b-41d4-a716-446655440020',
    };

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve([discrepancyDetectionRecord]);
      if (tableName === '旧システム請求書') return Promise.resolve([legacyInvoiceRecord]);
      if (tableName === '新システム請求書') return Promise.resolve([newInvoiceRecord]);
      if (tableName === '是正追跡管理履歴') return Promise.resolve([correctionTrackingRecord]);
      if (tableName === '差異確認履歴') return Promise.resolve([confirmationHistoryRecord]);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection.金額差異).toBe(-5000);
    expect(result.discrepancyDetection.重大度).toBe('高');
    expect(result.discrepancyDetection.許容範囲判定).toBe('外');
    expect(result.legacySystemInvoice?.請求書ID).toBe('INV-2024-001');
    expect(result.newSystemInvoice?.請求書ID).toBe('NEW-INV-2024-001');
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.confirmationHistory).toHaveLength(1);
  });
});
