import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-057: 新システムにのみ存在する請求書が差異として検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect invoice missing in legacy system as discrepancy', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: {
            toleranceAmount: 50000,
            severity: 'HIGH',
          },
          RECORD_COUNT_MISMATCH: {
            toleranceCount: 5,
            severity: 'MEDIUM',
          },
          STATUS_INCONSISTENCY: {
            toleranceCount: 3,
            severity: 'HIGH',
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
          status: 'draft',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'SF-2024-002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 250000,
          taxAmount: 25000,
          status: 'submitted',
          paymentDueDate: '2024-02-20',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'NEW-INV-001',
          invoiceNumber: 'NEW-2024-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'draft',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'NEW-INV-002',
          invoiceNumber: 'NEW-2024-002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 250000,
          taxAmount: 25000,
          status: 'submitted',
          paymentDueDate: '2024-02-20',
        },
        {
          invoiceId: 'NEW-INV-003',
          invoiceNumber: 'NEW-2024-003',
          invoiceDate: '2024-01-25',
          invoiceAmount: 150000,
          taxAmount: 15000,
          status: 'approved',
          paymentDueDate: '2024-02-25',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 2, totalAmount: 350000, status: 'active' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 3, totalAmount: 500000, status: 'active' },
      ],
      detectionTimestamp: '2024-01-26T10:30:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);

    const inv003Discrepancies = result.discrepancies.filter(
      (d) => d.newSystemInvoiceId === 'NEW-INV-003'
    );
    expect(inv003Discrepancies.length).toBeGreaterThan(0);

    inv003Discrepancies.forEach((d) => {
      expect(d.discrepancyType).toBe('RECORD_COUNT_MISMATCH');
      expect(d.legacyInvoiceId).toBeNull();
      expect(d.recordCountDifference).toBe(1);
      expect(d.amountDifference).toBeNull();
      expect(d.discrepancyContent).toContain('150000');
      expect(d.discrepancyContent).toContain('NEW-2024-003');
      expect(d.severity).toBe('MEDIUM');
      expect(d.causeClassification).toContain('missing_in_legacy');
      expect(d.toleranceJudgment).toBe('WITHIN_TOLERANCE');
    });

    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(1);
    expect(result.summaryReport.totalRecordCountDifference).toBe(1);
  });
});
