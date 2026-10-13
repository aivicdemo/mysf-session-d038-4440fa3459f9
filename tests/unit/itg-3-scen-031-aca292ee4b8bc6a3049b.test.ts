import { detectDiscrepancies, LegacyInvoiceDataMissing } from '../../src/logic/discrepancy-detection-engine';
import type { DetectDiscrepanciesInput } from '../../src/logic/discrepancy-detection-engine';

describe('SCEN-031: 既存システムのデータスナップショットが空のとき、エラーで throw される', () => {
  it('旧システム請求書データが空配列のときにLegacyInvoiceDataMissingエラーが発生する', async () => {
    const legacyInvoices: DetectDiscrepanciesInput['legacyInvoices'] = [];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-02-15',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
    ];

    const detectionTimestamp = '2024-01-20T10:00:00Z';

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow(LegacyInvoiceDataMissing);

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow('旧システム請求書データが取得できていません。照合対象データが不足しています。');
  });
});
