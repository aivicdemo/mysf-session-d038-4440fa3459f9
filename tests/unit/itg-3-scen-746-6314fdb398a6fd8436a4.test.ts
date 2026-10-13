import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-746: 是正方法と検証結果がAIエージェントに渡される', () => {
  it('差異詳細取得が正常に機能し、ダッシュボード詳細表示用に整形された結果が返される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    const { listRecords } = mockDataStore;

    // 前提条件: テーブルの内容をモック
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440001';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return [
          {
            id: discrepancyId,
            差異ID: discrepancyId,
            旧システム請求書ID: 'LEGACY-INV-2025-001',
            新システム請求書ID: 'NEW-INV-2025-001',
            差異種類: '金額差異',
            差異内容: '請求金額が旧システムでは150000円、新システムでは150500円',
            金額差異: 500,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2025-01-15T09:30:00Z',
            重大度: '高',
            原因分類: '税計算誤差',
            許容範囲判定: '範囲外',
            判定日時: '2025-01-15T10:00:00Z',
            判定者: 'user-judge-001',
            createdAt: '2025-01-15T09:30:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
        ];
      } else if (tableName === '旧システム請求書') {
        return [
          {
            id: 'legacy-rec-001',
            請求書ID: 'LEGACY-INV-2025-001',
            ユーザーID: 'user-sales-001',
            請求書番号: 'INV-LEGACY-20250115-001',
            請求日: '2025-01-10T00:00:00Z',
            請求金額: 150000,
            税金額: 15000,
            ステータス: '未発送',
            支払期限日: '2025-02-10T00:00:00Z',
            摘要: '商品A 10個',
            作成日時: '2025-01-10T08:00:00Z',
            更新日時: '2025-01-10T08:00:00Z',
            検証ステータス: '検証待ち',
            検証日時: null,
            createdAt: '2025-01-10T08:00:00Z',
            updatedAt: '2025-01-10T08:00:00Z',
          },
        ];
      } else if (tableName === '新システム請求書') {
        return [
          {
            id: 'new-rec-001',
            請求書ID: 'NEW-INV-2025-001',
            請求書番号: 'INV-NEW-20250115-001',
            請求日: '2025-01-10T00:00:00Z',
            請求金額: 150500,
            税金額: 15050,
            ステータス: '下書き',
            支払期限日: '2025-02-10T00:00:00Z',
            摘要: '商品A 10個',
            createdAt: '2025-01-10T08:00:00Z',
            updatedAt: '2025-01-10T08:00:00Z',
          },
        ];
      } else if (tableName === '是正追跡管理') {
        return [
          {
            id: 'correction-track-001',
            是正ID: 'correction-001',
            差異ID: discrepancyId,
            是正方法: '旧システム金額を150500に修正',
            是正ステータス: '完了',
            是正実行者: 'user-correction-001',
            是正実行日時: '2025-01-15T14:00:00Z',
            是正前データ: '{"請求金額": 150000, "税金額": 15000}',
            是正後データ: '{"請求金額": 150500, "税金額": 15050}',
            検証結果: '成功',
            createdAt: '2025-01-15T14:00:00Z',
            updatedAt: '2025-01-15T14:00:00Z',
          },
        ];
      } else if (tableName === '差異確認履歴') {
        return [
          {
            id: 'confirm-hist-001',
            確認ID: 'confirm-001',
            差異ID: discrepancyId,
            確認ユーザーID: 'user-accounting-001',
            確認日時: '2025-01-15T15:00:00Z',
            確認内容: '是正内容を確認し、新旧請求書の金額が一致したことを確認',
            判定結果: '承認',
            createdAt: '2025-01-15T15:00:00Z',
            updatedAt: '2025-01-15T15:00:00Z',
          },
        ];
      }
      return [];
    });

    // テスト実行
    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    // 期待結果の検証
    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.discrepancyDetection.差異ID).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.discrepancyDetection.重大度).toBe('高');
    expect(result.discrepancyDetection.金額差異).toBe(500);
    expect(result.discrepancyDetection.許容範囲判定).toBe('範囲外');

    expect(result.legacySystemInvoice).toEqual({
      invoiceId: 'LEGACY-INV-2025-001',
      invoiceNumber: 'INV-LEGACY-20250115-001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 150000,
      taxAmount: 15000,
      status: '未発送',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '商品A 10個',
    });

    expect(result.newSystemInvoice).toEqual({
      invoiceId: 'NEW-INV-2025-001',
      invoiceNumber: 'INV-NEW-20250115-001',
      invoiceDate: '2025-01-10T00:00:00Z',
      invoiceAmount: 150500,
      taxAmount: 15050,
      status: '下書き',
      paymentDueDate: '2025-02-10T00:00:00Z',
      remarks: '商品A 10個',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      correctionMethod: '旧システム金額を150500に修正',
      correctionStatus: '完了',
      verificationResult: '成功',
      correctionExecutionDateTime: '2025-01-15T14:00:00Z',
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      confirmationUserId: 'user-accounting-001',
      judgmentResult: '承認',
      confirmationDateTime: '2025-01-15T15:00:00Z',
      confirmationContent: '是正内容を確認し、新旧請求書の金額が一致したことを確認',
    });
  });
});
