import { detectDiscrepancies, InvalidInvoiceDataFormat } from '../../src/logic/discrepancy-detection-engine';

describe('SCEN-028: 新システムの請求書データの必須項目が不正な形式または欠落しているとき、エラーで処理が中断される', () => {
  it('新システム請求書のinvoiceIdがnullの場合、InvalidInvoiceDataFormatエラーが発生する', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-01',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'issued',
        paymentDueDate: '2024-02-01',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: null as any,
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-01',
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: 'issued',
        paymentDueDate: '2024-02-01',
      },
    ];

    const legacySalesData = [
      { salesId: 'SALES001', recordCount: 10, totalAmount: 1000000, status: 'active' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES001', recordCount: 10, totalAmount: 1000000, status: 'active' },
    ];

    const detectionTimestamp = '2024-01-15T10:30:00Z';

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow(InvalidInvoiceDataFormat);

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow('請求書データの形式が不正です。照合処理を続行できません。');
  });
});
