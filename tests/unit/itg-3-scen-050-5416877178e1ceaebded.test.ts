import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-050: 複数種類の差異が分類・集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect all three types of discrepancies and aggregate in summary report', async () => {
    const mockToleranceCriteria = {
      AMOUNT_DIFFERENCE: { severity: 'HIGH' },
      RECORD_COUNT_MISMATCH: { severity: 'MEDIUM' },
      STATUS_INCONSISTENCY: { severity: 'CRITICAL' },
    };

    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        return (mockToleranceCriteria as any)[input.discrepancyType] || null;
      }
    );

    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'SF-2024-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'SF-2024-002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 250000,
          taxAmount: 25000,
          status: 'paid',
          paymentDueDate: '2024-02-20',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'NEW-2024-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 105000,
          taxAmount: 10500,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'NEW-2024-002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 250000,
          taxAmount: 25000,
          status: 'unpaid',
          paymentDueDate: '2024-02-20',
        },
        {
          invoiceId: 'INV-003',
          invoiceNumber: 'NEW-2024-003',
          invoiceDate: '2024-01-25',
          invoiceAmount: 80000,
          taxAmount: 8000,
          status: 'issued',
          paymentDueDate: '2024-02-25',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'closed_won' },
        { salesId: 'SALES-002', recordCount: 3, totalAmount: 300000, status: 'negotiation' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 4, totalAmount: 520000, status: 'closed_won' },
        { salesId: 'SALES-002', recordCount: 3, totalAmount: 300000, status: 'qualification' },
      ],
      detectionTimestamp: '2024-01-31T09:00:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(6);

    const amountDifferences = result.discrepancies.filter(
      (d) => d.discrepancyType === 'AMOUNT_DIFFERENCE'
    );
    const recordCountMismatches = result.discrepancies.filter(
      (d) => d.discrepancyType === 'RECORD_COUNT_MISMATCH'
    );
    const statusInconsistencies = result.discrepancies.filter(
      (d) => d.discrepancyType === 'STATUS_INCONSISTENCY'
    );

    expect(amountDifferences.length).toBeGreaterThan(0);
    expect(recordCountMismatches.length).toBeGreaterThan(0);
    expect(statusInconsistencies.length).toBeGreaterThan(0);

    expect(result.totalDiscrepancyCount).toBe(6);
    expect(result.criticalDiscrepancyCount).toBeGreaterThanOrEqual(2);

    expect(result.summaryReport).toBeDefined();
    expect(result.summaryReport.totalAmountDifference).toBe(25000);
    expect(result.summaryReport.totalRecordCountDifference).toBe(2);
    expect(result.summaryReport.statusInconsistencyCount).toBe(2);
    expect(result.summaryReport.detectionSummary).toContain('金額差異');
    expect(result.summaryReport.detectionSummary).toContain('件数不一致');
    expect(result.summaryReport.detectionSummary).toContain('ステータス不整合');

    result.discrepancies.forEach((d) => {
      expect(d.discrepancyId).toBeDefined();
      expect(d.discrepancyId).toBeTruthy();
      expect(d.detectionTimestamp).toBe('2024-01-31T09:00:00Z');
      expect(d.causeClassification).toBeDefined();
      expect(d.judgmentTimestamp).toBeDefined();
    });
  });
});
