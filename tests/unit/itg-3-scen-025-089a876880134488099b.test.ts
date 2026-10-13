import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyEngine from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-025: 旧新システムの請求書・営業データがすべて揃い、許容基準も取得できる場合に、金額差異・件数不一致・ステータス不整合を検出して結果を返す', () => {
  it('金額差異・件数不一致・ステータス不整合を検出して結果を返す', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'INV20240101',
        invoiceDate: '2024-01-01',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-01',
        remarks: 'Q1商談',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: 'INV20240102',
        invoiceDate: '2024-01-05',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'issued',
        paymentDueDate: '2024-02-05',
        remarks: null,
      },
      {
        invoiceId: 'INV-003',
        invoiceNumber: 'INV20240103',
        invoiceDate: '2024-01-10',
        invoiceAmount: 750000,
        taxAmount: 75000,
        status: 'paid',
        paymentDueDate: '2024-02-10',
        remarks: null,
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'INV20240101',
        invoiceDate: '2024-01-01',
        invoiceAmount: 1050000,
        taxAmount: 105000,
        status: 'issued',
        paymentDueDate: '2024-02-01',
        remarks: 'Q1商談',
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: 'INV20240102',
        invoiceDate: '2024-01-05',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'unpaid',
        paymentDueDate: '2024-02-05',
        remarks: null,
      },
      {
        invoiceId: 'INV-004',
        invoiceNumber: 'INV20240104',
        invoiceDate: '2024-01-15',
        invoiceAmount: 300000,
        taxAmount: 30000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
        remarks: null,
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 2500000, status: 'active' },
      { salesId: 'SALES-002', recordCount: 3, totalAmount: 1200000, status: 'active' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 2600000, status: 'active' },
      { salesId: 'SALES-002', recordCount: 2, totalAmount: 1100000, status: 'inactive' },
    ];

    const detectionTimestamp = '2024-01-20T15:30:00Z';

    const mockToleranceCriteria = {
      AMOUNT_DIFFERENCE: { toleranceAmount: 50000, severity: 'MEDIUM' },
      RECORD_COUNT_MISMATCH: { toleranceCount: 2, severity: 'HIGH' },
      STATUS_INCONSISTENCY: { toleranceCount: 1, severity: 'CRITICAL' },
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

    expect(result.discrepancies).toHaveLength(5);
    expect(result.totalDiscrepancyCount).toBe(5);
    expect(result.criticalDiscrepancyCount).toBe(1);
    expect(result.exceedsToleranceCount).toBe(1);

    const amountDiffDiscrepancy = result.discrepancies.find(
      (d) => d.discrepancyType === 'AMOUNT_DIFFERENCE' && d.legacyInvoiceId === 'INV-001'
    );
    expect(amountDiffDiscrepancy).toBeDefined();
    expect(amountDiffDiscrepancy?.amountDifference).toBe(50000);
    expect(amountDiffDiscrepancy?.severity).toBe('MEDIUM');
    expect(amountDiffDiscrepancy?.toleranceJudgment).toBe('WITHIN_TOLERANCE');

    const statusInconsistencyDiscrepancy = result.discrepancies.find(
      (d) => d.discrepancyType === 'STATUS_INCONSISTENCY' && d.legacyInvoiceId === 'INV-002'
    );
    expect(statusInconsistencyDiscrepancy).toBeDefined();
    expect(statusInconsistencyDiscrepancy?.severity).toBe('CRITICAL');
    expect(statusInconsistencyDiscrepancy?.toleranceJudgment).toBe('EXCEEDS_TOLERANCE');

    const recordCountMismatch = result.discrepancies.filter(
      (d) => d.discrepancyType === 'RECORD_COUNT_MISMATCH'
    );
    expect(recordCountMismatch.length).toBe(3);

    result.discrepancies.forEach((d) => {
      expect(d.detectionTimestamp).toBe(detectionTimestamp);
      expect(d.discrepancyId).toBeDefined();
    });

    expect(result.summaryReport.totalAmountDifference).toBe(50000);
    expect(result.summaryReport.totalRecordCountDifference).toBe(1);
    expect(result.summaryReport.statusInconsistencyCount).toBe(1);
  });
});
