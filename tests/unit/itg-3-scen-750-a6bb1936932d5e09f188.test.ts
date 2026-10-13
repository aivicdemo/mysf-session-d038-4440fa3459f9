import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-750: ロールバック時の回復リスク判定', () => {
  it('金額差異と件数差異からロールバック時の回復リスクが正常に判定される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    const { listRecords } = mockDataStore;

    const discrepancyId = 'diff-2024-001';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return [
          {
            id: 'diff-2024-001',
            差異ID: 'diff-2024-001',
            旧システム請求書ID: 'legacy-inv-001',
            新システム請求書ID: 'new-inv-001',
            差異種類: '金額差異',
            差異内容: '請求金額の不一致',
            金額差異: 50000,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2024-01-15T10:30:00Z',
            重大度: '高',
            原因分類: 'システム計算エラー',
            許容範囲判定: '範囲外',
            判定日時: '2024-01-15T10:35:00Z',
            判定者: 'user-001',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:35:00Z',
          },
        ];
      } else if (tableName === '旧システム請求書') {
        return [
          {
            id: 'legacy-inv-001',
            請求書ID: 'legacy-inv-001',
            ユーザーID: 'user-legacy-001',
            請求書番号: 'LEG-2024-001',
            請求日: '2024-01-10T00:00:00Z',
            請求金額: 1000000,
            税金額: 100000,
            ステータス: '請求済',
            支払期限日: '2024-02-10T00:00:00Z',
            摘要: '商品A納入分',
            作成日時: '2024-01-10T09:00:00Z',
            更新日時: '2024-01-10T09:00:00Z',
            検証ステータス: '未検証',
            検証日時: null,
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-01-10T09:00:00Z',
          },
        ];
      } else if (tableName === '新システム請求書') {
        return [
          {
            id: 'new-inv-001',
            請求書ID: 'new-inv-001',
            請求書番号: 'NEW-2024-001',
            請求日: '2024-01-10T00:00:00Z',
            請求金額: 950000,
            税金額: 95000,
            ステータス: '請求済',
            支払期限日: '2024-02-10T00:00:00Z',
            摘要: '商品A納入分',
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-01-10T09:00:00Z',
          },
        ];
      } else if (tableName === '是正追跡管理') {
        return [
          {
            id: 'correction-001',
            是正ID: 'correction-001',
            差異ID: 'diff-2024-001',
            是正方法: 'ロールバック',
            是正ステータス: '実行予定',
            是正実行者: 'user-002',
            是正実行日時: null,
            是正前データ: '{"請求金額": 950000}',
            是正後データ: null,
            検証結果: null,
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z',
          },
        ];
      } else if (tableName === '差異確認履歴') {
        return [
          {
            id: 'confirm-001',
            確認ID: 'confirm-001',
            差異ID: 'diff-2024-001',
            確認ユーザーID: 'user-003',
            確認日時: '2024-01-15T11:15:00Z',
            確認内容: 'ロールバック方針を確認。影響件数1件、金額差異50000円。',
            判定結果: '承認',
            createdAt: '2024-01-15T11:15:00Z',
            updatedAt: '2024-01-15T11:15:00Z',
          },
        ];
      }
      return [];
    });

    // テスト実行
    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    // 期待結果の検証
    expect(result.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection.金額差異).toBe(50000);
    expect(result.discrepancyDetection.件数差異).toBe(0);
    expect(result.discrepancyDetection.重大度).toBe('高');

    expect(result.legacySystemInvoice).toEqual({
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LEG-2024-001',
      invoiceDate: '2024-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '請求済',
      paymentDueDate: '2024-02-10T00:00:00Z',
      remarks: '商品A納入分',
    });

    expect(result.newSystemInvoice).toEqual({
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NEW-2024-001',
      invoiceDate: '2024-01-10T00:00:00Z',
      invoiceAmount: 950000,
      taxAmount: 95000,
      status: '請求済',
      paymentDueDate: '2024-02-10T00:00:00Z',
      remarks: '商品A納入分',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      correctionMethod: 'ロールバック',
      correctionStatus: '実行予定',
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      judgmentResult: '承認',
    });
  });
});
