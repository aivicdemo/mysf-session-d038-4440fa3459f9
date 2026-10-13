import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-651: その他の差異は優先度「中」「低」として分類', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('原因分類が「その他」で金額差分150円の場合、複数の確認履歴に優先度「中」「低」が記録される', async () => {
    const discrepancyId = 'd-uuid-001';

    const mockDiscrepancyDetection = {
      id: 'd-uuid-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '消費税計算の端数処理による差異',
      金額差異: 150,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '低',
      原因分類: 'その他',
      許容範囲判定: '許容範囲外',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'user-uuid-001',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    };

    const mockLegacyInvoice = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-2025-001',
      請求日: '2025-01-01T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '確定',
      支払期限日: '2025-02-01T00:00:00Z',
      摘要: '商品A納入',
      作成日時: '2025-01-01T00:00:00Z',
      更新日時: '2025-01-01T00:00:00Z',
      検証ステータス: '未検証',
      検証日時: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockNewInvoice = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'INV-2025-001',
      請求日: '2025-01-01T00:00:00Z',
      請求金額: 100150,
      税金額: 10015,
      ステータス: '確定',
      支払期限日: '2025-02-01T00:00:00Z',
      摘要: '商品A納入',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockConfirmationHistory1 = {
      id: 'conf-uuid-001',
      確認ID: 'conf-uuid-001',
      差異ID: 'd-uuid-001',
      確認ユーザーID: 'user-uuid-002',
      確認日時: '2025-01-15T14:00:00Z',
      確認内容: 'システム仕様による許容可能な差異と判断',
      判定結果: '中',
      createdAt: '2025-01-15T14:00:00Z',
      updatedAt: '2025-01-15T14:00:00Z',
    };

    const mockConfirmationHistory2 = {
      id: 'conf-uuid-002',
      確認ID: 'conf-uuid-002',
      差異ID: 'd-uuid-001',
      確認ユーザーID: 'user-uuid-003',
      確認日時: '2025-01-16T09:30:00Z',
      確認内容: '端数処理の説明を確認、対応不要',
      判定結果: '低',
      createdAt: '2025-01-16T09:30:00Z',
      updatedAt: '2025-01-16T09:30:00Z',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockDiscrepancyDetection])
      .mockResolvedValueOnce([mockLegacyInvoice])
      .mockResolvedValueOnce([mockNewInvoice])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockConfirmationHistory1, mockConfirmationHistory2]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('d-uuid-001');
    expect(result.discrepancyDetection.causeClassification).toBe('その他');
    expect(result.discrepancyDetection.severity).toBe('低');
    expect(result.discrepancyDetection.amountDifference).toBe(150);

    expect(result.legacySystemInvoice?.invoiceNumber).toBe('INV-2025-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(100000);

    expect(result.newSystemInvoice?.invoiceNumber).toBe('INV-2025-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(100150);

    expect(result.correctionTrackingHistory).toHaveLength(0);

    expect(result.confirmationHistory).toHaveLength(2);
    expect(result.confirmationHistory[0].judgmentResult).toBe('中');
    expect(result.confirmationHistory[1].judgmentResult).toBe('低');
  });
});
