import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyTolerance from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-040: 請求書データの商談IDと請求日でのマッチング・許容範囲判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システムと新システムの請求書データを商談IDと請求日でマッチングして金額・件数・ステータスを比較し、許容範囲判定を実施する', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-0001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: '2024-0002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'paid',
        paymentDueDate: '2024-02-20',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NEW-001',
        invoiceNumber: '2024-0001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000500,
        taxAmount: 100050,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'NEW-002',
        invoiceNumber: '2024-0002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'unpaid',
        paymentDueDate: '2024-02-20',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 50, totalAmount: 5000000, status: 'closed' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 50, totalAmount: 5000000, status: 'closed' },
    ];

    const toleranceCriteria = {
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 1000,
        tolerancePercentage: 0.5,
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 5,
      },
      STATUS_INCONSISTENCY: {
        allowedStatusTransitions: [
          { from: 'issued', to: 'unpaid' },
          { from: 'issued', to: 'paid' },
        ],
      },
    };

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(
      toleranceCriteria
    );

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp: '2024-01-25T10:30:00Z',
    });

    expect(result.discrepancies).toHaveLength(2);

    // 差異1: INV-001/NEW-001 の AMOUNT_DIFFERENCE (500円 < 1000円 -> WITHIN_TOLERANCE)
    const amountDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'AMOUNT_DIFFERENCE' &&
        d.legacyInvoiceId === 'INV-001'
    );
    expect(amountDiffDiscrepancy).toBeDefined();
    expect(amountDiffDiscrepancy?.amountDifference).toBe(500);
    expect(amountDiffDiscrepancy?.severity).toBe('LOW');
    expect(amountDiffDiscrepancy?.toleranceJudgment).toBe('WITHIN_TOLERANCE');

    // 差異2: INV-002/NEW-002 の STATUS_INCONSISTENCY (paid -> unpaid は許容されていない)
    const statusDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'STATUS_INCONSISTENCY' &&
        d.legacyInvoiceId === 'INV-002'
    );
    expect(statusDiffDiscrepancy).toBeDefined();
    expect(statusDiffDiscrepancy?.severity).toBe('HIGH');
    expect(statusDiffDiscrepancy?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    // 集計値の検証
    expect(result.totalDiscrepancyCount).toBe(2);
    expect(result.criticalDiscrepancyCount).toBe(0);
    expect(result.exceedsToleranceCount).toBe(1);

    // summaryReport の検証
    expect(result.summaryReport.totalAmountDifference).toBe(500);
    expect(result.summaryReport.totalRecordCountDifference).toBe(0);
    expect(result.summaryReport.statusInconsistencyCount).toBe(1);

    // 各差異に対して discrepancyId, detectionTimestamp, judgmentTimestamp が ISO 8601 形式で設定されている
    result.discrepancies.forEach((discrepancy) => {
      expect(discrepancy.discrepancyId).toBeTruthy();
      expect(discrepancy.detectionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(discrepancy.judgmentTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    // legacySalesData と newSystemSalesData が完全に一致するため営業データ差異は検出されない
    const salesDiscrepancies = result.discrepancies.filter((d) =>
      ['SALES-001'].includes(d.legacyInvoiceId)
    );
    expect(salesDiscrepancies).toHaveLength(0);
  });
});
