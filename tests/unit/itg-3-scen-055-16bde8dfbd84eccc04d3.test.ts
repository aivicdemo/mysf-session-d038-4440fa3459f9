import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-055: 同じ請求書IDの複数レコードすべてが照合対象になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compare all combinations of records with same invoiceId', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: {
            toleranceAmount: 10000,
            tolerancePercentage: 5,
          },
          RECORD_COUNT_MISMATCH: {
            toleranceCount: 2,
          },
          STATUS_INCONSISTENCY: {
            tolerableStatusTransitions: ['issued', 'pending'],
          },
        };
        return criteria[input.discrepancyType] || null;
      }
    );

    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2025-001',
          invoiceDate: '2025-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2025-02-15',
        },
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2025-001-A',
          invoiceDate: '2025-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2025-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'INV-2025-002',
          invoiceDate: '2025-01-16',
          invoiceAmount: 200000,
          taxAmount: 20000,
          status: 'paid',
          paymentDueDate: '2025-02-16',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2025-001',
          invoiceDate: '2025-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          paymentDueDate: '2025-02-15',
        },
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2025-001-A',
          invoiceDate: '2025-01-15',
          invoiceAmount: 105000,
          taxAmount: 10500,
          status: 'issued',
          paymentDueDate: '2025-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'INV-2025-002',
          invoiceDate: '2025-01-16',
          invoiceAmount: 200000,
          taxAmount: 20000,
          status: 'paid',
          paymentDueDate: '2025-02-16',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 10, totalAmount: 500000, status: 'closed_won' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 10, totalAmount: 500000, status: 'closed_won' },
      ],
      detectionTimestamp: '2025-01-20T10:30:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);

    const inv001Discrepancies = result.discrepancies.filter(
      (d) => d.legacyInvoiceId === 'INV-001'
    );

    expect(inv001Discrepancies.length).toBeGreaterThanOrEqual(2);

    const amountDifferences = inv001Discrepancies.filter(
      (d) => d.discrepancyType === 'AMOUNT_DIFFERENCE'
    );
    expect(amountDifferences.length).toBeGreaterThanOrEqual(1);

    amountDifferences.forEach((d) => {
      expect(d.amountDifference).toBe(5000);
      expect(d.toleranceJudgment).toBe('WITHIN_TOLERANCE');
    });

    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(2);
    expect(result.summaryReport.totalAmountDifference).toBe(10000);
  });
});
