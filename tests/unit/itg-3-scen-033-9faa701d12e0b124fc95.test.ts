import { detectDiscrepancies, ToleranceCriteriaNotFound } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-033: 許容閾値が負の数のとき、エラーで throw される', () => {
  it('許容基準の値が負数の場合、エラーが発生する', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES001', recordCount: 5, totalAmount: 500000, status: 'completed' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES001', recordCount: 5, totalAmount: 500000, status: 'completed' },
    ];

    const detectionTimestamp = '2024-01-20T10:00:00Z';

    const mockToleranceCriteriaWithNegative = {
      AMOUNT_DIFFERENCE: { toleranceThreshold: -5000, recordCountTolerance: 1, statusTolerance: [] },
    };

    (toleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(
      mockToleranceCriteriaWithNegative
    );

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow();
  });
});
