import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteriaModule from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-051: 重大度別の差異件数が正確に集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly aggregate discrepancies by severity level', async () => {
    jest.spyOn(toleranceCriteriaModule, 'getToleranceCriteriaByDiscrepancyType').mockImplementation(
      async (input: any) => {
        const criteria: any = {
          AMOUNT_DIFFERENCE: {
            toleranceAmount: 10000,
            severityThreshold: {
              CRITICAL: 500000,
              HIGH: 100000,
              MEDIUM: 50000,
              LOW: 10000,
            },
          },
          RECORD_COUNT_MISMATCH: {
            toleranceCount: 2,
            severityThreshold: {
              CRITICAL: 10,
              HIGH: 5,
              MEDIUM: 3,
              LOW: 1,
            },
          },
          STATUS_INCONSISTENCY: {
            toleranceCount: 0,
            severityThreshold: {
              CRITICAL: 5,
              HIGH: 3,
              MEDIUM: 1,
              LOW: 0,
            },
          },
        };
        return criteria[input.discrepancyType] || null;
      }
    );

    const input = {
      legacyInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          status: '請求済',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'INV-2024-0002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 500000,
          taxAmount: 50000,
          status: '未請求',
          paymentDueDate: '2024-02-20',
        },
        {
          invoiceId: 'INV-003',
          invoiceNumber: 'INV-2024-0003',
          invoiceDate: '2024-01-25',
          invoiceAmount: 750000,
          taxAmount: 75000,
          status: '入金済',
          paymentDueDate: '2024-02-25',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 1000100,
          taxAmount: 100010,
          status: '請求済',
          paymentDueDate: '2024-02-15',
        },
        {
          invoiceId: 'INV-002',
          invoiceNumber: 'INV-2024-0002',
          invoiceDate: '2024-01-20',
          invoiceAmount: 500000,
          taxAmount: 50000,
          status: '未請求',
          paymentDueDate: '2024-02-20',
        },
        {
          invoiceId: 'INV-003',
          invoiceNumber: 'INV-2024-0003',
          invoiceDate: '2024-01-25',
          invoiceAmount: 750000,
          taxAmount: 75000,
          status: '入金済',
          paymentDueDate: '2024-02-25',
        },
        {
          invoiceId: 'INV-004',
          invoiceNumber: 'INV-2024-0004',
          invoiceDate: '2024-02-01',
          invoiceAmount: 2000000,
          taxAmount: 200000,
          status: '請求済',
          paymentDueDate: '2024-03-01',
        },
      ],
      legacySalesData: [
        { salesId: 'SALES-001', recordCount: 5, totalAmount: 5000000, status: 'クローズ済' },
        { salesId: 'SALES-002', recordCount: 3, totalAmount: 1500000, status: '進行中' },
        { salesId: 'SALES-003', recordCount: 8, totalAmount: 8000000, status: 'クローズ済' },
      ],
      newSystemSalesData: [
        { salesId: 'SALES-001', recordCount: 5, totalAmount: 5000000, status: 'クローズ済' },
        { salesId: 'SALES-002', recordCount: 3, totalAmount: 1500500, status: '進行中' },
        { salesId: 'SALES-004', recordCount: 2, totalAmount: 1000000, status: 'クローズ済' },
      ],
      detectionTimestamp: '2024-02-01T09:00:00Z',
    };

    const result = await detectDiscrepancies(input);

    expect(result).toBeDefined();
    expect(result.discrepancies).toBeInstanceOf(Array);
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(5);

    expect(result.totalDiscrepancyCount).toBe(5);
    expect(result.criticalDiscrepancyCount).toBe(0);
    expect(result.exceedsToleranceCount).toBe(0);

    expect(result.summaryReport).toBeDefined();
    expect(result.summaryReport.totalAmountDifference).toBe(600);
    expect(result.summaryReport.totalRecordCountDifference).toBe(3);
    expect(result.summaryReport.statusInconsistencyCount).toBe(0);

    result.discrepancies.forEach((d) => {
      expect(d.detectionTimestamp).toBe('2024-02-01T09:00:00Z');
      expect(d.discrepancyId).toBeTruthy();
      expect(d.causeClassification).toBeDefined();
    });
  });
});
