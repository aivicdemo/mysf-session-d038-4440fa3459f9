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

describe('SCEN-738: 金額差異が1万円以上10万円未満の場合、重大度が『高』と判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額差異50000円で重大度が「高」と判定され、営業部システム担当と経理部門へのエスカレーション対象データが取得される', async () => {
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-738-high-amount',
    };

    const discrepancyRecord: DiscrepancyDetectionRecord = {
      discrepancyId: 'diff-738-high-amount',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額の不一致が検出されました',
      amountDifference: 50000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T09:30:00Z',
      severity: '高',
      causeClassification: '税金計算ロジック相違',
      toleranceJudgment: '超過',
      toleranceJudgmentDateTime: '2026-01-15T09:35:00Z',
      judgedByUserId: 'judge-user-001',
    };

    const legacyInvoiceRecord: LegacySystemInvoiceRecord = {
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'LEG-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '2026年1月分商品売上',
    };

    const newInvoiceRecord: NewSystemInvoiceRecord = {
      invoiceId: 'new-inv-001',
      invoiceNumber: 'NEW-2026-001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1050000,
      taxAmount: 150000,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '2026年1月分商品売上',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoiceRecord])
      .mockResolvedValueOnce([newInvoiceRecord])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result: RetrieveDiscrepancyDetailsForConfirmationOutput =
      await retrieveDiscrepancyDetailsForConfirmation(input);

    expect(result.discrepancyId).toBe('diff-738-high-amount');
    expect(result.discrepancyDetection.amountDifference).toBe(50000);
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe(
      '税金計算ロジック相違'
    );
    expect(result.discrepancyDetection.toleranceJudgment).toBe('超過');
    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1050000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
