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

describe('SCEN-739: 件数不一致が1～4件の場合、重大度が『高』と判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('件数差異3件で重大度が「高」と判定され、営業部システム担当と経理部門へのエスカレーション対象データが取得される', async () => {
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-2024-001',
    };

    const discrepancyRecord: DiscrepancyDetectionRecord = {
      discrepancyId: 'diff-2024-001',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '件数差異',
      discrepancyContent: '請求明細行の件数が一致しない',
      amountDifference: 0,
      countDifference: 3,
      statusDifference: null,
      detectionDateTime: '2024-01-15T10:30:00Z',
      severity: '高',
      causeClassification: '移行時データ欠落',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2024-01-15T10:35:00Z',
      judgedByUserId: 'user-judge-001',
    };

    const legacyInvoiceRecord: LegacySystemInvoiceRecord = {
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LEG-2024-0001',
      invoiceDate: '2024-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2024-02-10T00:00:00Z',
      remarks: '商品A～D販売代金',
    };

    const newInvoiceRecord: NewSystemInvoiceRecord = {
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NEW-2024-0001',
      invoiceDate: '2024-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2024-02-10T00:00:00Z',
      remarks: '商品A販売代金',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoiceRecord])
      .mockResolvedValueOnce([newInvoiceRecord])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result: RetrieveDiscrepancyDetailsForConfirmationOutput =
      await retrieveDiscrepancyDetailsForConfirmation(input);

    expect(result.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-2024-001');
    expect(result.discrepancyDetection.countDifference).toBe(3);
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('範囲外');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2024-0001');
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2024-0001');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
