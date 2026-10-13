import {
  retrieveDiscrepancyDetailsForConfirmation,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
  type RetrieveDiscrepancyDetailsForConfirmationOutput,
  type DiscrepancyDetectionRecord,
  type LegacySystemInvoiceRecord,
  type NewSystemInvoiceRecord,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-737: 件数不一致が5件以上の場合、重大度が『極度』と判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('件数差異5件で重大度が「極度」と判定され、エスカレーション対象データが取得される', async () => {
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-001',
    };

    const discrepancyRecord: DiscrepancyDetectionRecord = {
      discrepancyId: 'diff-001',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '件数不一致',
      discrepancyContent: '請求明細行数が異なる',
      amountDifference: 0,
      countDifference: 5,
      statusDifference: null,
      detectionDateTime: '2026-10-07T10:00:00Z',
      severity: '極度',
      causeClassification: '移行ロジックエラー',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2026-10-07T10:05:00Z',
      judgedByUserId: 'user-judge-001',
    };

    const legacyInvoiceRecord: LegacySystemInvoiceRecord = {
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LG-2026-10001',
      invoiceDate: '2026-10-01T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2026-10-31T00:00:00Z',
      remarks: '商品A・B・Cの請求',
    };

    const newInvoiceRecord: NewSystemInvoiceRecord = {
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NW-2026-10001',
      invoiceDate: '2026-10-01T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2026-10-31T00:00:00Z',
      remarks: '商品A・B・Cの請求',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoiceRecord])
      .mockResolvedValueOnce([newInvoiceRecord])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result: RetrieveDiscrepancyDetailsForConfirmationOutput =
      await retrieveDiscrepancyDetailsForConfirmation(input);

    expect(result.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.countDifference).toBe(5);
    expect(result.discrepancyDetection.severity).toBe('極度');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LG-2026-10001');
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NW-2026-10001');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
