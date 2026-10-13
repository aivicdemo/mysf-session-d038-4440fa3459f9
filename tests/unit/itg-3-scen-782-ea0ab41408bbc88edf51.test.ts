import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-782: ステータス不整合が1～9件の場合、リスク程度が『中程度』と判定される', () => {
  const mockListRecords = jest.mocked(dataStore.listRecords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ステータス不整合の詳細情報を含むすべてのデータを返す', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: discrepancyId,
        差異ID: discrepancyId,
        旧システム請求書ID: 'INV-OLD-001',
        新システム請求書ID: 'INV-NEW-001',
        差異種類: 'status_mismatch',
        差異内容: 'ステータスが異なる',
        金額差異: 0,
        件数差異: 0,
        ステータス差異: 'pending→completed',
        検出日時: '2026-01-15T10:30:00Z',
        重大度: 'medium',
        原因分類: 'system_sync_delay',
        許容範囲判定: 'outside',
        判定日時: '2026-01-15T10:35:00Z',
        判定者: 'user-001',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T10:35:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'inv-old-id-001',
        請求書ID: 'INV-OLD-001',
        ユーザーID: 'user-100',
        請求書番号: 'OLD-2026-001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'pending',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A販売',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: 'pending',
        検証日時: null,
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'inv-new-id-001',
        請求書ID: 'INV-NEW-001',
        請求書番号: 'NEW-2026-001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: 'completed',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '商品A販売',
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-10T09:00:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'correction-uuid-001',
        是正ID: '660e8400-e29b-41d4-a716-446655440001',
        差異ID: discrepancyId,
        是正方法: 'manual_update',
        是正ステータス: 'completed',
        是正実行者: 'user-002',
        是正実行日時: '2026-01-15T11:00:00Z',
        是正前データ: '{"status":"pending"}',
        是正後データ: '{"status":"completed"}',
        検証結果: 'success',
        createdAt: '2026-01-15T11:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      },
    ];

    const confirmationData = [
      {
        id: 'confirm-uuid-001',
        確認ID: '770e8400-e29b-41d4-a716-446655440002',
        差異ID: discrepancyId,
        確認ユーザーID: 'user-003',
        確認日時: '2026-01-15T11:30:00Z',
        確認内容: 'ステータス不整合を確認し、旧システムを新システムに合わせて修正済み',
        判定結果: 'confirmed',
        createdAt: '2026-01-15T11:30:00Z',
        updatedAt: '2026-01-15T11:30:00Z',
      },
    ];

    mockListRecords.mockImplementation(async (tableName: string) => {
      switch (tableName) {
        case '差異検出結果':
          return discrepancyDetectionData as any;
        case '旧システム請求書':
          return legacyInvoiceData as any;
        case '新システム請求書':
          return newInvoiceData as any;
        case '是正追跡管理':
          return correctionTrackingData as any;
        case '差異確認履歴':
          return confirmationData as any;
        default:
          return [];
      }
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection).toMatchObject({
      discrepancyId: discrepancyId,
      legacySystemInvoiceId: 'INV-OLD-001',
      newSystemInvoiceId: 'INV-NEW-001',
      discrepancyType: 'status_mismatch',
      discrepancyContent: 'ステータスが異なる',
      amountDifference: 0,
      countDifference: 0,
      statusDifference: 'pending→completed',
      detectionDateTime: '2026-01-15T10:30:00Z',
      severity: 'medium',
      causeClassification: 'system_sync_delay',
      toleranceJudgment: 'outside',
      toleranceJudgmentDateTime: '2026-01-15T10:35:00Z',
      judgedByUserId: 'user-001',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      invoiceId: 'INV-OLD-001',
      invoiceNumber: 'OLD-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: 'pending',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品A販売',
    });
    expect(result.newSystemInvoice).toMatchObject({
      invoiceId: 'INV-NEW-001',
      invoiceNumber: 'NEW-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: 'completed',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品A販売',
    });
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      correctionId: '660e8400-e29b-41d4-a716-446655440001',
      differenceId: discrepancyId,
      correctionMethod: 'manual_update',
      correctionStatus: 'completed',
      correctionExecutorUserId: 'user-002',
      correctionExecutionDateTime: '2026-01-15T11:00:00Z',
    });
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      confirmationId: '770e8400-e29b-41d4-a716-446655440002',
      discrepancyId,
      confirmationUserId: 'user-003',
      confirmationDateTime: '2026-01-15T11:30:00Z',
      judgmentResult: 'confirmed',
    });
  });
});
