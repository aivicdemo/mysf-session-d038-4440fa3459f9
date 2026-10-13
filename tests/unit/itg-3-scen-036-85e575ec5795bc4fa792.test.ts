import { detectDiscrepancies, LegacyInvoiceDataMissing } from '../../src/logic/discrepancy-detection-engine';

describe('SCEN-036: 既存システムのデータが空の場合のエラーハンドリング', () => {
  it('既存システムのデータが空の場合、LegacyInvoiceDataMissing エラーで throw される', async () => {
    const legacyInvoices: any[] = [];
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
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'closed_won' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES-001', recordCount: 5, totalAmount: 500000, status: 'closed_won' },
    ];

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp: '2024-01-20T10:30:00Z',
      })
    ).rejects.toThrow(LegacyInvoiceDataMissing);

    try {
      await detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp: '2024-01-20T10:30:00Z',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LegacyInvoiceDataMissing);
      expect((error as Error).message).toBe(
        '旧システム請求書データが取得できていません。照合対象データが不足しています。'
      );
    }
  });
});
