import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-056: 旧システムにのみ存在する請求書が差異として検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect invoice missing in new system as discrepancy', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: {
            toleranceAmount: 50000,
            tolerancePercentage: 5,
          },
          RECORD_COUNT_MISMATCH: {
            toleranceRecordCount: 1,
          },
          STATUS_INCONSISTENCY: {
            tolerableStatuses: ['issued', 'pending'],
          },
        };
        return criteria[input.discrepancyType] || null;
      }
    );

    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-LEGACY-001',
          invoiceNumber: 'SF-2024-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
          remarks: 'Contract renewal',
        },
        {
          invoiceId: 'INV-LEGACY-002',
          invoiceNumber: 'SF-2024-002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 500000,
          taxAmount: 50000,
          status: 'issued',
          paymentDueDate: '2024-02-20',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-NEW-001',
          invoiceNumber: 'NEW-2024-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          status: 'issued',
          paymentDueDate: '2024-02-15',
          remarks: 'Contract renewal',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 2, totalAmount: 1500000, status: 'active' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 1, totalAmount: 1000000, status: 'active' },
      ],
      detectionTimestamp: '2024-01-25T10:30:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);

    const inv002Discrepancies = result.discrepancies.filter(
      (d) => d.legacyInvoiceId === 'INV-LEGACY-002'
    );
    expect(inv002Discrepancies.length).toBeGreaterThan(0);

    inv002Discrepancies.forEach((d) => {
      expect(d.discrepancyType).toBe('RECORD_COUNT_MISMATCH');
      expect(d.newSystemInvoiceId).toBeNull();
      expect(d.recordCountDifference).toBe(1);
      expect(d.amountDifference).toBeNull();
      expect(d.causeClassification).toContain('missing_in_new_system');
      expect(d.toleranceJudgment).toBe('WITHIN_TOLERANCE');
      expect(d.severity).toBe('MEDIUM');
    });

    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(1);
    expect(result.exceedsToleranceCount).toBe(0);
    expect(result.summaryReport.totalRecordCountDifference).toBeGreaterThanOrEqual(1);
  });
});
