import {
  retrieveDiscrepancyDetailsForConfirmation,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
  type RetrieveDiscrepancyDetailsForConfirmationOutput,
  type DiscrepancyDetectionRecord,
  type LegacySystemInvoiceRecord,
  type NewSystemInvoiceRecord,
  type CorrectionTrackingRecord,
  type DiscrepancyConfirmationRecord,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-735: 許容範囲判定で差異が許容範囲を超過と判定された場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異ID diff-001-uuid の差異詳細を取得し、超過判定と重大度が適切に返却される', async () => {
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-001-uuid',
    };

    const discrepancyRecord: DiscrepancyDetectionRecord = {
      discrepancyId: 'diff-001-uuid',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が異なる',
      amountDifference: 50000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-10-07T08:30:00Z',
      severity: '高',
      causeClassification: '計算誤差',
      toleranceJudgment: '超過',
      toleranceJudgmentDateTime: '2026-10-07T09:00:00Z',
      judgedByUserId: 'user-validator-001',
    };

    const legacyInvoiceRecord: LegacySystemInvoiceRecord = {
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LEG-2026-10-001',
      invoiceDate: '2026-10-01T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '請求済',
      paymentDueDate: '2026-10-31T00:00:00Z',
      remarks: '旧システムデータ',
    };

    const newInvoiceRecord: NewSystemInvoiceRecord = {
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NEW-2026-10-001',
      invoiceDate: '2026-10-01T00:00:00Z',
      invoiceAmount: 950000,
      taxAmount: 95000,
      status: '請求済',
      paymentDueDate: '2026-10-31T00:00:00Z',
      remarks: '新システムデータ',
    };

    const correctionRecord: CorrectionTrackingRecord = {
      correctionId: 'correction-001-uuid',
      differenceId: 'diff-001-uuid',
      correctionMethod: '手動調整',
      correctionStatus: '未実施',
      correctionExecutorUserId: '',
      correctionExecutionDateTime: '',
      dataBeforeCorrection: '{"金額": 1000000}',
      dataAfterCorrection: null,
      verificationResult: null,
    };

    const confirmationRecord: DiscrepancyConfirmationRecord = {
      confirmationId: 'confirm-001-uuid',
      discrepancyId: 'diff-001-uuid',
      confirmationUserId: 'user-reviewer-001',
      confirmationDateTime: '2026-10-07T09:15:00Z',
      confirmationContent: '差異内容を確認し、許容範囲超過と判定',
      judgmentResult: '超過',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoiceRecord])
      .mockResolvedValueOnce([newInvoiceRecord])
      .mockResolvedValueOnce([correctionRecord])
      .mockResolvedValueOnce([confirmationRecord]);

    const result: RetrieveDiscrepancyDetailsForConfirmationOutput =
      await retrieveDiscrepancyDetailsForConfirmation(input);

    expect(result.discrepancyId).toBe('diff-001-uuid');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('超過');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe(
      '2026-10-07T09:00:00Z'
    );

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2026-10-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.legacySystemInvoice?.status).toBe('請求済');

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2026-10-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(950000);
    expect(result.newSystemInvoice?.status).toBe('請求済');

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('手動調整');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('未実施');

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('超過');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe(
      '2026-10-07T09:15:00Z'
    );
  });
});
