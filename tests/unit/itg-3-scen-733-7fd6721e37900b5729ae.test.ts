import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-733: 差異検出時の重大度別エスカレーションと是正指示 - 許容基準の取得', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('許容基準の取得で、差異種類に応じた閾値が確定され、次の判定工程に渡される', async () => {
    const discrepancyData = [
      {
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-20240115-001',
        新システム請求書ID: 'NEW-INV-20240115-001',
        差異種類: '金額差異',
        差異内容: '請求金額に1500円の差異を検出',
        金額差異: 1500,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T09:30:00Z',
        重大度: '高',
        原因分類: '消費税計算誤り',
        許容範囲判定: '範囲外',
        判定日時: '2024-01-15T10:00:00Z',
        判定者: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f7g8',
        id: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        請求書ID: 'LEGACY-INV-20240115-001',
        ユーザーID: 'USER-LEG-20240115-001',
        請求書番号: 'LEG-2024-000123',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '請求済',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: '2024年1月分サービス提供',
        作成日時: '2024-01-10T08:00:00Z',
        更新日時: '2024-01-10T08:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        id: 'LEGACY-INV-20240115-001',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        請求書ID: 'NEW-INV-20240115-001',
        請求書番号: 'NEW-2024-000123',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 101500,
        税金額: 11500,
        ステータス: '請求済',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: '2024年1月分サービス提供',
        id: 'NEW-INV-20240115-001',
        createdAt: '2024-01-10T08:30:00Z',
        updatedAt: '2024-01-10T08:30:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        是正ID: 'CORR-20240115-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: 'データ修正',
        是正ステータス: '実行済',
        是正実行者: 'b2c3d4e5-f6a7-4890-b123-c4d5e6f7g8h9',
        是正実行日時: '2024-01-15T11:15:00Z',
        是正前データ: '{"請求金額": 100000, "税金額": 10000}',
        是正後データ: '{"請求金額": 101500, "税金額": 11500}',
        検証結果: '成功',
        id: 'CORR-20240115-001',
        createdAt: '2024-01-15T11:15:00Z',
        updatedAt: '2024-01-15T11:15:00Z',
      },
    ];

    const confirmationHistoryData = [
      {
        確認ID: 'CONF-20240115-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'c3d4e5f6-a7b8-4901-c234-d5e6f7g8h9i0',
        確認日時: '2024-01-15T11:45:00Z',
        確認内容: '是正内容を確認し、妥当性を検証した。消費税計算が正しく修正されている。',
        判定結果: '承認',
        id: 'CONF-20240115-001',
        createdAt: '2024-01-15T11:45:00Z',
        updatedAt: '2024-01-15T11:45:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionTrackingData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');

    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('範囲外');
    expect(result.discrepancyDetection.amountDifference).toBe(1500);

    expect(result.legacySystemInvoice!.invoiceNumber).toBe('LEG-2024-000123');
    expect(result.legacySystemInvoice!.invoiceDate).toBe('2024-01-10T00:00:00Z');
    expect(result.legacySystemInvoice!.invoiceAmount).toBe(100000);
    expect(result.legacySystemInvoice!.taxAmount).toBe(10000);
    expect(result.legacySystemInvoice!.status).toBe('請求済');
    expect(result.legacySystemInvoice!.paymentDueDate).toBe('2024-02-10T00:00:00Z');
    expect(result.legacySystemInvoice!.remarks).toBe('2024年1月分サービス提供');

    expect(result.newSystemInvoice!.invoiceNumber).toBe('NEW-2024-000123');
    expect(result.newSystemInvoice!.invoiceDate).toBe('2024-01-10T00:00:00Z');
    expect(result.newSystemInvoice!.invoiceAmount).toBe(101500);
    expect(result.newSystemInvoice!.taxAmount).toBe(11500);
    expect(result.newSystemInvoice!.status).toBe('請求済');
    expect(result.newSystemInvoice!.paymentDueDate).toBe('2024-02-10T00:00:00Z');
    expect(result.newSystemInvoice!.remarks).toBe('2024年1月分サービス提供');

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('CORR-20240115-001');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('データ修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行済');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('b2c3d4e5-f6a7-4890-b123-c4d5e6f7g8h9');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2024-01-15T11:15:00Z');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('CONF-20240115-001');
    expect(result.confirmationHistory[0].confirmationUserId).toBe('c3d4e5f6-a7b8-4901-c234-d5e6f7g8h9i0');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-01-15T11:45:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('是正内容を確認し、妥当性を検証した。消費税計算が正しく修正されている。');
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
