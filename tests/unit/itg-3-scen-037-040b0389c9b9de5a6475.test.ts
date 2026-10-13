import { detectDiscrepancies, NewSystemInvoiceDataMissing } from '../../src/logic/discrepancy-detection-engine';

describe('SCEN-037: 新システムのデータが空の場合のエラーハンドリング', () => {
  it('新システムのデータが空の場合、NewSystemInvoiceDataMissing エラーで throw される', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: 'INV-20240101-001',
        invoiceDate: '2024-01-01',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'issued',
        paymentDueDate: '2024-01-31',
      },
    ];

    const newSystemInvoices: any[] = [];

    const legacySalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'active' },
    ];

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp: '2024-01-15T10:30:00Z',
      })
    ).rejects.toThrow(NewSystemInvoiceDataMissing);

    try {
      await detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp: '2024-01-15T10:30:00Z',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(NewSystemInvoiceDataMissing);
      expect((error as Error).message).toBe(
        '新システム請求書データが取得できていません。照合対象データが不足しています。'
      );
    }
  });
});
