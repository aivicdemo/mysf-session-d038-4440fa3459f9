import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-655: ファイル保存失敗時にレポート内容を内部DBに一時保存し、ストレージ復旧後に非同期で転送し、最大5回まで指数バックオフで再試行できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数のテーブルからデータを取得して整形された差異情報を返す', async () => {
    const discrepancyId = 'disc-12345678-uuid';

    const mockDiscrepancyDetectionData = [
      {
        id: 'disc-12345678-uuid',
        discrepancyId: 'disc-12345678-uuid',
        legacySystemInvoiceId: 'legacy-inv-001',
        newSystemInvoiceId: 'new-inv-001',
        discrepancyType: '金額差異',
        discrepancyContent: '請求金額の不一致',
        amountDifference: 5000,
        countDifference: 0,
        statusDifference: null,
        detectionDateTime: '2026-01-15T10:30:00Z',
        severity: '中',
        causeClassification: '計算誤差',
        toleranceJudgment: '範囲外',
        toleranceJudgmentDateTime: '2026-01-15T11:00:00Z',
        judgedByUserId: 'user-uuid-001',
      },
    ];

    const mockLegacyInvoiceData = [
      {
        id: 'legacy-record-001',
        invoiceId: 'legacy-inv-001',
        invoiceNumber: 'LEG-2026-001',
        invoiceDate: '2026-01-10T00:00:00Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: '確定',
        paymentDueDate: '2026-02-10T00:00:00Z',
        remarks: '商品A販売',
      },
    ];

    const mockNewInvoiceData = [
      {
        id: 'new-record-001',
        invoiceId: 'new-inv-001',
        invoiceNumber: 'NEW-2026-001',
        invoiceDate: '2026-01-10T00:00:00Z',
        invoiceAmount: 95000,
        taxAmount: 9500,
        status: '確定',
        paymentDueDate: '2026-02-10T00:00:00Z',
        remarks: '商品A販売',
      },
    ];

    const mockCorrectionTrackingData = [
      {
        correctionId: 'correction-001',
        differenceId: 'disc-12345678-uuid',
        correctionMethod: 'データ修正',
        correctionStatus: '実施済み',
        correctionExecutorUserId: 'user-uuid-002',
        correctionExecutionDateTime: '2026-01-15T14:00:00Z',
        dataBeforeCorrection: '{"金額": 95000}',
        dataAfterCorrection: '{"金額": 100000}',
        verificationResult: '成功',
      },
    ];

    const mockConfirmationHistoryData = [
      {
        confirmationId: 'confirm-001',
        discrepancyId: 'disc-12345678-uuid',
        confirmationUserId: 'user-uuid-003',
        confirmationDateTime: '2026-01-15T15:30:00Z',
        confirmationContent: 'データ修正の妥当性を確認',
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

    expect(result.discrepancyId).toBe('disc-12345678-uuid');

    expect(result.discrepancyDetection.discrepancyId).toBe('disc-12345678-uuid');
    expect(result.discrepancyDetection.legacySystemInvoiceId).toBe('legacy-inv-001');
    expect(result.discrepancyDetection.newSystemInvoiceId).toBe('new-inv-001');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額の不一致');
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2026-01-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('中');
    expect(result.discrepancyDetection.causeClassification).toBe('計算誤差');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('範囲外');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2026-01-15T11:00:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('user-uuid-001');

    expect(result.legacySystemInvoice).toEqual({
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LEG-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品A販売',
    });

    expect(result.newSystemInvoice).toEqual({
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NEW-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 95000,
      taxAmount: 9500,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '商品A販売',
    });

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('correction-001');
    expect(result.correctionTrackingHistory[0].differenceId).toBe('disc-12345678-uuid');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('データ修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実施済み');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-uuid-002');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2026-01-15T14:00:00Z');
    expect(result.correctionTrackingHistory[0].dataBeforeCorrection).toBe('{"金額": 95000}');
    expect(result.correctionTrackingHistory[0].dataAfterCorrection).toBe('{"金額": 100000}');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('confirm-001');
    expect(result.confirmationHistory[0].discrepancyId).toBe('disc-12345678-uuid');
    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-uuid-003');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2026-01-15T15:30:00Z');
    expect(result.confirmationHistory[0].confirmationContent).toBe('データ修正の妥当性を確認');
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
  });
});
