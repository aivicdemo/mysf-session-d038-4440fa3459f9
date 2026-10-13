import { detectDiscrepancies, NewSystemInvoiceDataMissing } from '../../src/logic/discrepancy-detection-engine';
import type { DetectDiscrepanciesInput } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-032: 新システムのデータスナップショットが空のとき、エラーで throw される', () => {
  it('新システム請求書データが空配列のときにNewSystemInvoiceDataMissingエラーが発生する', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'INV-20240101-001',
        invoiceDate: '2024-01-01',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-02-01',
      },
    ];

    const newSystemInvoices: DetectDiscrepanciesInput['newSystemInvoices'] = [];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
    ];

    const detectionTimestamp = '2024-01-15T10:30:00Z';

    const mockToleranceCriteria = {
      AMOUNT_DIFFERENCE: { toleranceAmount: 5000, causeClassification: 'rounding_error' },
      RECORD_COUNT_MISMATCH: { toleranceCount: 2, causeClassification: 'timing_difference' },
      STATUS_INCONSISTENCY: {
        tolerableStatuses: ['issued', 'pending'],
        causeClassification: 'synchronization_delay',
      },
    };

    (toleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(
      mockToleranceCriteria
    );

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow(NewSystemInvoiceDataMissing);

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow('新システム請求書データが取得できていません。照合対象データが不足しています。');
  });
});
