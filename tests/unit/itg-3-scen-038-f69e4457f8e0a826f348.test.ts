import { detectDiscrepancies } from '../../src/logic/discrepancy-detection-engine';
import * as discrepancyTolerance from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-038: フィールドマッピング定義が不完全な場合の警告出力', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィールドマッピング定義が不完全な場合、警告が出力される', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-16',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'paid',
        paymentDueDate: '2024-02-16',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
      {
        invoiceId: 'INV002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-16',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'paid',
        paymentDueDate: '2024-02-16',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES001', recordCount: 10, totalAmount: 1500000, status: 'completed' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES001', recordCount: 10, totalAmount: 1500000, status: 'completed' },
    ];

    const toleranceCriteria = {
      AMOUNT_DIFFERENCE: { toleranceAmount: 10000, severity: 'HIGH' },
      RECORD_COUNT_MISMATCH: { toleranceCount: 5, severity: 'MEDIUM' },
      STATUS_INCONSISTENCY: { toleranceDifference: 2, severity: 'CRITICAL' },
    };

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(
      toleranceCriteria
    );

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp: '2024-01-20T10:30:00Z',
    });

    expect(result.discrepancies).toHaveLength(0);
    expect(result.totalDiscrepancyCount).toBe(0);
    expect(result.criticalDiscrepancyCount).toBe(0);
    expect(result.exceedsToleranceCount).toBe(0);

    const warningMessage = result.summaryReport.detectionSummary;
    expect(warningMessage).toContain('一部のフィールドマッピング定義が不完全');
  });
});
