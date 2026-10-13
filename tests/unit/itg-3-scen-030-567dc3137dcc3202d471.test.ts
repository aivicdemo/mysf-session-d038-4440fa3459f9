import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-030: 既存システムと新システムのデータを記録単位でマッチングして件数・金額・ステータスの差異を分類し、代表値で設計どおりの分類結果を返す', () => {
  it('データを記録単位でマッチングして差異を検出し、分類結果を返す', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'SF-2024-0001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: 'SF-2024-0002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 2000000,
        taxAmount: 200000,
        status: 'paid',
        paymentDueDate: '2024-02-20',
      },
      {
        invoiceId: 'INV-003',
        invoiceNumber: 'SF-2024-0003',
        invoiceDate: '2024-01-25',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'issued',
        paymentDueDate: '2024-02-25',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'NEW-2024-0001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: 'NEW-2024-0002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 1950000,
        taxAmount: 195000,
        status: 'issued',
        paymentDueDate: '2024-02-20',
      },
      {
        invoiceId: 'INV-004',
        invoiceNumber: 'NEW-2024-0004',
        invoiceDate: '2024-01-28',
        invoiceAmount: 750000,
        taxAmount: 75000,
        status: 'issued',
        paymentDueDate: '2024-02-28',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 10, totalAmount: 3500000, status: 'completed' },
      { salesId: 'SALES-002', recordCount: 5, totalAmount: 1200000, status: 'in_progress' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 10, totalAmount: 3500000, status: 'completed' },
      { salesId: 'SALES-002', recordCount: 4, totalAmount: 1100000, status: 'in_progress' },
    ];

    const detectionTimestamp = '2024-02-01T09:00:00Z';

    const mockToleranceCriteria = {
      AMOUNT_DIFFERENCE: { toleranceAmount: 50000, tolerancePercentage: 1 },
      RECORD_COUNT_MISMATCH: { toleranceCount: 2 },
      STATUS_INCONSISTENCY: { tolerableStatusTransitions: ['issued->paid', 'in_progress->completed'] },
    };

    (toleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(
      mockToleranceCriteria
    );

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp,
    });

    expect(result.totalDiscrepancyCount).toBe(4);
    expect(result.criticalDiscrepancyCount).toBe(0);
    expect(result.exceedsToleranceCount).toBe(2);

    const amountDiffDiscrepancy = result.discrepancies.find(
      (d) => d.discrepancyType === 'AMOUNT_DIFFERENCE' && d.legacyInvoiceId === 'INV-002'
    );
    expect(amountDiffDiscrepancy).toBeDefined();
    expect(amountDiffDiscrepancy?.amountDifference).toBe(50000);
    expect(amountDiffDiscrepancy?.toleranceJudgment).toBe('WITHIN_TOLERANCE');

    const statusInconsistencyDiscrepancy = result.discrepancies.find(
      (d) => d.discrepancyType === 'STATUS_INCONSISTENCY' && d.legacyInvoiceId === 'INV-002'
    );
    expect(statusInconsistencyDiscrepancy).toBeDefined();
    expect(statusInconsistencyDiscrepancy?.statusDifference).toBe('paid->issued');
    expect(statusInconsistencyDiscrepancy?.toleranceJudgment).toBe('WITHIN_TOLERANCE');

    const recordCountMismatchDiscrepancies = result.discrepancies.filter(
      (d) => d.discrepancyType === 'RECORD_COUNT_MISMATCH'
    );
    expect(recordCountMismatchDiscrepancies.length).toBe(2);

    const inv003Missing = recordCountMismatchDiscrepancies.find((d) => d.legacyInvoiceId === 'INV-003');
    expect(inv003Missing).toBeDefined();
    expect(inv003Missing?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    const inv004New = recordCountMismatchDiscrepancies.find((d) => d.newSystemInvoiceId === 'INV-004');
    expect(inv004New).toBeDefined();
    expect(inv004New?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    expect(result.summaryReport.totalAmountDifference).toBe(150000);
    expect(result.summaryReport.totalRecordCountDifference).toBe(1);
    expect(result.summaryReport.statusInconsistencyCount).toBe(1);
  });
});
