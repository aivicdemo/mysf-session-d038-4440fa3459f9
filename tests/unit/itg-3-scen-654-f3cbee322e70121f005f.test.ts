import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-654: 差異原因分類レポートをファイルとしてストレージに保存できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDを指定して、ダッシュボード詳細表示用に整形された差異情報を取得できる', async () => {
    const discrepancyId = 'diff-uuid-20241215-001';

    const mockDiscrepancyDetectionData = [
      {
        id: 'diff-uuid-20241215-001',
        discrepancyId: 'diff-uuid-20241215-001',
        legacySystemInvoiceId: 'legacy-inv-2024-0501',
        newSystemInvoiceId: 'new-inv-2024-0501',
        discrepancyType: '金額差異',
        discrepancyContent: '消費税計算ロジック相違による税金額の食い違い',
        amountDifference: 1500,
        countDifference: 0,
        statusDifference: null,
        detectionDateTime: '2024-12-15T10:30:00Z',
        severity: '高',
        causeClassification: 'システムロジック差異',
        toleranceJudgment: '範囲外',
        toleranceJudgmentDateTime: '2024-12-15T11:00:00Z',
        judgedByUserId: 'user-uuid-judge-001',
      },
    ];

    const mockLegacyInvoiceData = [
      {
        id: 'legacy-inv-2024-0501',
        invoiceId: 'legacy-inv-2024-0501',
        invoiceNumber: 'LEG-2024-0501',
        invoiceDate: '2024-12-01T00:00:00Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: '未支払',
        paymentDueDate: '2024-12-31T00:00:00Z',
        remarks: '2024年11月分システムサービス利用料',
      },
    ];

    const mockNewInvoiceData = [
      {
        id: 'new-inv-2024-0501',
        invoiceId: 'new-inv-2024-0501',
        invoiceNumber: 'NEW-2024-0501',
        invoiceDate: '2024-12-01T00:00:00Z',
        invoiceAmount: 100000,
        taxAmount: 8500,
        status: '未支払',
        paymentDueDate: '2024-12-31T00:00:00Z',
        remarks: '2024年11月分システムサービス利用料',
      },
    ];

    const mockCorrectionTrackingData = [
      {
        correctionId: 'correction-uuid-001',
        differenceId: 'diff-uuid-20241215-001',
        correctionMethod: '新システム側の税計算ロジックを修正',
        correctionStatus: '実行済み',
        correctionExecutorUserId: 'user-uuid-dev-001',
        correctionExecutionDateTime: '2024-12-15T16:45:00Z',
        dataBeforeCorrection: '{"taxCalculationMethod": "simple_percentage"}',
        dataAfterCorrection: '{"taxCalculationMethod": "complex_rounding_rule"}',
        verificationResult: '成功',
      },
    ];

    const mockConfirmationHistoryData = [
      {
        confirmationId: 'confirmation-uuid-001',
        discrepancyId: 'diff-uuid-20241215-001',
        confirmationUserId: 'user-uuid-manager-001',
        confirmationDateTime: '2024-12-15T17:30:00Z',
        confirmationContent: '是正内容を確認し、検証結果が正常であることを確認した',
        judgmentResult: '承認',
      },
    ];

    (dataStore.listRecords as jest.Mock)
      .mockImplementation((tableName: string) => {
        if (tableName === '差異検出結果') return Promise.resolve(mockDiscrepancyDetectionData);
        if (tableName === '旧システム請求書') return Promise.resolve(mockLegacyInvoiceData);
        if (tableName === '新システム請求書') return Promise.resolve(mockNewInvoiceData);
        if (tableName === '是正追跡管理') return Promise.resolve(mockCorrectionTrackingData);
        if (tableName === '差異確認履歴') return Promise.resolve(mockConfirmationHistoryData);
        return Promise.resolve([]);
      });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('diff-uuid-20241215-001');

    expect(result.discrepancyDetection).toEqual({
      discrepancyId: 'diff-uuid-20241215-001',
      legacySystemInvoiceId: 'legacy-inv-2024-0501',
      newSystemInvoiceId: 'new-inv-2024-0501',
      discrepancyType: '金額差異',
      discrepancyContent: '消費税計算ロジック相違による税金額の食い違い',
      amountDifference: 1500,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2024-12-15T10:30:00Z',
      severity: '高',
      causeClassification: 'システムロジック差異',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2024-12-15T11:00:00Z',
      judgedByUserId: 'user-uuid-judge-001',
    });

    expect(result.legacySystemInvoice).toEqual({
      invoiceId: 'legacy-inv-2024-0501',
      invoiceNumber: 'LEG-2024-0501',
      invoiceDate: '2024-12-01T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '未支払',
      paymentDueDate: '2024-12-31T00:00:00Z',
      remarks: '2024年11月分システムサービス利用料',
    });

    expect(result.newSystemInvoice).toEqual({
      invoiceId: 'new-inv-2024-0501',
      invoiceNumber: 'NEW-2024-0501',
      invoiceDate: '2024-12-01T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 8500,
      status: '未支払',
      paymentDueDate: '2024-12-31T00:00:00Z',
      remarks: '2024年11月分システムサービス利用料',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toEqual({
      correctionId: 'correction-uuid-001',
      differenceId: 'diff-uuid-20241215-001',
      correctionMethod: '新システム側の税計算ロジックを修正',
      correctionStatus: '実行済み',
      correctionExecutorUserId: 'user-uuid-dev-001',
      correctionExecutionDateTime: '2024-12-15T16:45:00Z',
      dataBeforeCorrection: '{"taxCalculationMethod": "simple_percentage"}',
      dataAfterCorrection: '{"taxCalculationMethod": "complex_rounding_rule"}',
      verificationResult: '成功',
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toEqual({
      confirmationId: 'confirmation-uuid-001',
      discrepancyId: 'diff-uuid-20241215-001',
      confirmationUserId: 'user-uuid-manager-001',
      confirmationDateTime: '2024-12-15T17:30:00Z',
      confirmationContent: '是正内容を確認し、検証結果が正常であることを確認した',
      judgmentResult: '承認',
    });
  });
});
