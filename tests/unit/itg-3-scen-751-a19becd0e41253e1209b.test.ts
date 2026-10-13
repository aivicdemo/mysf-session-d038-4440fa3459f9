import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-751: ロールバック選択または金額差異が閾値の2倍超の場合の承認マーク', () => {
  it('ロールバック選択かつ金額差異が閾値の2倍を超える場合、経理部門の承認が必要とマークされる', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    const { listRecords } = mockDataStore;

    const discrepancyId = 'diff-001';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return [
          {
            id: 'diff-001',
            旧システム請求書ID: 'legacy-inv-001',
            新システム請求書ID: 'new-inv-001',
            差異種類: '金額差異',
            差異内容: '請求金額が一致しない',
            金額差異: 500000,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2026-01-15T10:30:00Z',
            重大度: '高',
            原因分類: 'システムエラー',
            許容範囲判定: '範囲外',
            判定日時: '2026-01-15T11:00:00Z',
            判定者: 'user-judge-001',
            createdAt: '2026-01-15T10:30:00Z',
            updatedAt: '2026-01-15T11:00:00Z',
          },
        ];
      } else if (tableName === '旧システム請求書') {
        return [
          {
            id: 'legacy-001',
            請求書ID: 'legacy-inv-001',
            ユーザーID: 'user-001',
            請求書番号: 'INV-2026-0001',
            請求日: '2026-01-10T00:00:00Z',
            請求金額: 1000000,
            税金額: 100000,
            ステータス: '発行済み',
            支払期限日: '2026-02-10T00:00:00Z',
            摘要: '商品販売代金',
            作成日時: '2026-01-10T09:00:00Z',
            更新日時: '2026-01-10T09:00:00Z',
            検証ステータス: '未検証',
            検証日時: null,
            createdAt: '2026-01-10T09:00:00Z',
            updatedAt: '2026-01-10T09:00:00Z',
          },
        ];
      } else if (tableName === '新システム請求書') {
        return [
          {
            id: 'new-001',
            請求書ID: 'new-inv-001',
            請求書番号: 'INV-2026-0001',
            請求日: '2026-01-10T00:00:00Z',
            請求金額: 1500000,
            税金額: 150000,
            ステータス: '発行済み',
            支払期限日: '2026-02-10T00:00:00Z',
            摘要: '商品販売代金',
            createdAt: '2026-01-10T09:00:00Z',
            updatedAt: '2026-01-10T09:00:00Z',
          },
        ];
      } else if (tableName === '是正追跡管理') {
        return [
          {
            id: 'correction-001',
            是正ID: 'correction-001',
            差異ID: 'diff-001',
            是正方法: 'ロールバック',
            是正ステータス: '申請中',
            是正実行者: 'user-corrector-001',
            是正実行日時: '2026-01-15T14:00:00Z',
            是正前データ: '{"請求金額": 1500000}',
            是正後データ: '{"請求金額": 1000000}',
            検証結果: '未検証',
            createdAt: '2026-01-15T14:00:00Z',
            updatedAt: '2026-01-15T14:00:00Z',
          },
        ];
      } else if (tableName === '差異確認履歴') {
        return [
          {
            id: 'confirmation-001',
            確認ID: 'confirmation-001',
            差異ID: 'diff-001',
            確認ユーザーID: 'user-approver-001',
            確認日時: '2026-01-15T13:00:00Z',
            確認内容: '差異を確認、経理部門の承認待ち',
            判定結果: '経理部門承認必要',
            createdAt: '2026-01-15T13:00:00Z',
            updatedAt: '2026-01-15T13:00:00Z',
          },
        ];
      }
      return [];
    });

    // テスト実行
    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    // 期待結果の検証
    expect(result.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.重大度).toBe('高');
    expect(result.discrepancyDetection.金額差異).toBe(500000);
    expect(result.discrepancyDetection.原因分類).toBe('システムエラー');

    expect(result.legacySystemInvoice).toEqual({
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '発行済み',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品販売代金',
    });

    expect(result.newSystemInvoice).toEqual({
      invoiceId: 'new-inv-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1500000,
      taxAmount: 150000,
      status: '発行済み',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品販売代金',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      correctionMethod: 'ロールバック',
      correctionStatus: '申請中',
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      judgmentResult: '経理部門承認必要',
    });
  });
});
