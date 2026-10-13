import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyTolerance from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-035: マッチング・差異分類・重大度判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存システムと新システムのデータを記録ID単位でマッチングして件数・金額・ステータスの差異を分類し、代表値で設計どおりの分類結果を返す', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'SF-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: 'SF-2024-002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'paid',
        paymentDueDate: '2024-02-20',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'SF-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: 'SF-2024-002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 510000,
        taxAmount: 51000,
        status: 'issued',
        paymentDueDate: '2024-02-20',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 50, totalAmount: 5000000, status: 'active' },
      { salesId: 'SALES-002', recordCount: 30, totalAmount: 3000000, status: 'active' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 50, totalAmount: 5000000, status: 'active' },
      { salesId: 'SALES-002', recordCount: 25, totalAmount: 2500000, status: 'active' },
    ];

    const toleranceCriteria = {
      AMOUNT_DIFFERENCE: { toleranceAmount: 50000, severity: 'HIGH' },
      RECORD_COUNT_MISMATCH: { toleranceCount: 5, severity: 'MEDIUM' },
      STATUS_INCONSISTENCY: { allowedStatusTransitions: ['issued', 'paid'], severity: 'HIGH' },
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

    expect(result.discrepancies).toHaveLength(4);

    // 差異1: INV-002 の AMOUNT_DIFFERENCE (10000 < 50000 -> WITHIN_TOLERANCE)
    const amountDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'AMOUNT_DIFFERENCE' &&
        d.legacyInvoiceId === 'INV-002'
    );
    expect(amountDiffDiscrepancy).toBeDefined();
    expect(amountDiffDiscrepancy?.amountDifference).toBe(10000);
    expect(amountDiffDiscrepancy?.severity).toBe('HIGH');
    expect(amountDiffDiscrepancy?.toleranceJudgment).toBe('WITHIN_TOLERANCE');

    // 差異2: INV-002 の STATUS_INCONSISTENCY (paid -> issued は不許容)
    const statusDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'STATUS_INCONSISTENCY' &&
        d.legacyInvoiceId === 'INV-002'
    );
    expect(statusDiffDiscrepancy).toBeDefined();
    expect(statusDiffDiscrepancy?.severity).toBe('HIGH');
    expect(statusDiffDiscrepancy?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    // 差異3: SALES-002 の RECORD_COUNT_MISMATCH (-5)
    // 営業データの差異も legacyInvoiceId フィールドに記録される
    const recordCountDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'RECORD_COUNT_MISMATCH' &&
        (d.legacyInvoiceId === 'SALES-002' || d.newSystemInvoiceId === 'SALES-002')
    );
    expect(recordCountDiffDiscrepancy).toBeDefined();
    expect(recordCountDiffDiscrepancy?.recordCountDifference).toBe(-5);
    expect(recordCountDiffDiscrepancy?.severity).toBe('MEDIUM');
    expect(recordCountDiffDiscrepancy?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    // 差異4: SALES-002 の AMOUNT_DIFFERENCE (500000 > 50000 -> EXCEEDS_TOLERANCE)
    const salesAmountDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === 'AMOUNT_DIFFERENCE' &&
        (d.legacyInvoiceId === 'SALES-002' || d.newSystemInvoiceId === 'SALES-002')
    );
    expect(salesAmountDiffDiscrepancy).toBeDefined();
    expect(salesAmountDiffDiscrepancy?.amountDifference).toBe(500000);
    expect(salesAmountDiffDiscrepancy?.severity).toBe('HIGH');
    expect(salesAmountDiffDiscrepancy?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    // 集計値の検証
    expect(result.totalDiscrepancyCount).toBe(4);
    expect(result.criticalDiscrepancyCount).toBe(0);
    expect(result.exceedsToleranceCount).toBe(3);

    // summaryReport の検証
    expect(result.summaryReport.totalAmountDifference).toBe(510000);
    expect(result.summaryReport.totalRecordCountDifference).toBe(-5);
    expect(result.summaryReport.statusInconsistencyCount).toBe(1);
  });
});
