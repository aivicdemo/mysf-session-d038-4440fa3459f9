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

describe('SCEN-736: 金額差異が10万円以上の場合、重大度が『極度』と判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差異150000円で重大度が「極度」と判定され、エスカレーション対象データが取得される', async () => {
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-uuid-001',
    };

    const discrepancyRecord: DiscrepancyDetectionRecord = {
      discrepancyId: 'diff-uuid-001',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額の不一致',
      amountDifference: 150000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T09:30:00Z',
      severity: '極度',
      causeClassification: 'システムマッピング誤り',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2026-01-15T10:00:00Z',
      judgedByUserId: 'judge-uuid-001',
    };

    const legacyInvoiceRecord: LegacySystemInvoiceRecord = {
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LEG-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1150000,
      taxAmount: 115000,
      status: '未払い',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'システムA請求書',
    };

    const newInvoiceRecord: NewSystemInvoiceRecord = {
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NEW-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '未払い',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'システムB請求書',
    };

    const correctionRecord: CorrectionTrackingRecord = {
      correctionId: 'corr-uuid-001',
      differenceId: 'diff-uuid-001',
      correctionMethod: '手動調整',
      correctionStatus: '実行待ち',
      correctionExecutorUserId: '',
      correctionExecutionDateTime: '',
      dataBeforeCorrection: '{"金額": 1150000}',
      dataAfterCorrection: null,
      verificationResult: null,
    };

    const confirmationRecord: DiscrepancyConfirmationRecord = {
      confirmationId: 'conf-uuid-001',
      discrepancyId: 'diff-uuid-001',
      confirmationUserId: 'reviewer-uuid-001',
      confirmationDateTime: '2026-01-15T10:30:00Z',
      confirmationContent: '金額差異を確認。旧システムの請求金額が150,000円高い。',
      judgmentResult: '差異確認',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoiceRecord])
      .mockResolvedValueOnce([newInvoiceRecord])
      .mockResolvedValueOnce([correctionRecord])
      .mockResolvedValueOnce([confirmationRecord]);

    const result: RetrieveDiscrepancyDetailsForConfirmationOutput =
      await retrieveDiscrepancyDetailsForConfirmation(input);

    expect(result.discrepancyId).toBe('diff-uuid-001');
    expect(result.discrepancyDetection.amountDifference).toBe(150000);
    expect(result.discrepancyDetection.severity).toBe('極度');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1150000);
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('実行待ち');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('差異確認');
  });
});
