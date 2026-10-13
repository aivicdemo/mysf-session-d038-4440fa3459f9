import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-052: 許容範囲内と超過が区別される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should distinguish between within-tolerance and exceeds-tolerance for same discrepancy type', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: {
            toleranceValue: 5000,
            criteria: '金額差異が5000円以内の場合は許容範囲内',
          },
          RECORD_COUNT_MISMATCH: {
            toleranceValue: 2,
            criteria: '件数差異が2件以内の場合は許容範囲内',
          },
          STATUS_INCONSISTENCY: {
            toleranceStatus: ['issued', 'pending'],
            criteria: '指定ステータス間の遷移は許容範囲内',
          },
        };
        return criteria[input.discrepancyType] || null;
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
          invoiceDate: '2024-01-16',
          invoiceAmount: 50000,
          taxAmount: 5000,
          status: 'issued',
          paymentDueDate: '2024-02-16',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'SF-2024-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100500,
          taxAmount: 10050,
          status: 'issued',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'SF-2024-002',
          invoiceDate: '2024-01-16',
          invoiceAmount: 50000,
          taxAmount: 5000,
          status: 'issued',
          paymentDueDate: '2024-02-16',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 10, totalAmount: 500000, status: 'closed' },
        { salesId: 'SALES-002', recordCount: 5, totalAmount: 250000, status: 'in_progress' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 10, totalAmount: 510000, status: 'closed' },
        { salesId: 'SALES-002', recordCount: 5, totalAmount: 250000, status: 'in_progress' },
      ],
      detectionTimestamp: '2024-01-20T10:30:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(2);

    const withinTolerance = result.discrepancies.filter(
      (d) => d.toleranceJudgment === 'WITHIN_TOLERANCE'
    );
    const exceedsTolerance = result.discrepancies.filter(
      (d) => d.toleranceJudgment === 'EXCEEDS_TOLERANCE'
    );

    expect(withinTolerance.length).toBeGreaterThan(0);
    expect(exceedsTolerance.length).toBeGreaterThan(0);

    expect(result.totalDiscrepancyCount).toBe(2);
    expect(result.exceedsToleranceCount).toBe(1);

    expect(result.summaryReport).toBeDefined();
    expect(result.summaryReport.totalAmountDifference).toBe(10500);
  });
});
