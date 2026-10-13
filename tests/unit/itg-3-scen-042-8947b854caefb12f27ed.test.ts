import { detectDiscrepancies, NewSystemInvoiceDataMissing } from '../../src/logic/discrepancy-detection-engine';

describe('SCEN-042: 新システムの請求データが空またはnullの場合、エラーで throw される', () => {
  it('新システム請求データが空配列の場合、NewSystemInvoiceDataMissingエラーがthrowされる', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'SF-2025-001',
        invoiceDate: '2025-01-15',
        invoiceAmount: 150000,
        taxAmount: 15000,
        status: 'issued',
        paymentDueDate: '2025-02-15',
      },
    ];

    const newSystemInvoices: Array<{
      invoiceId: string;
      invoiceNumber: string;
      invoiceDate: string;
      invoiceAmount: number;
      taxAmount: number;
      status: string;
      paymentDueDate: string;
    }> = [];

    const legacySalesData = [
      {
        salesId: 'SALES-001',
        recordCount: 5,
        totalAmount: 500000,
        status: 'active',
      },
    ];

    const newSystemSalesData = [
      {
        salesId: 'SALES-001',
        recordCount: 5,
        totalAmount: 500000,
        status: 'active',
      },
    ];

    const detectionTimestamp = '2025-01-20T10:30:00Z';

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
