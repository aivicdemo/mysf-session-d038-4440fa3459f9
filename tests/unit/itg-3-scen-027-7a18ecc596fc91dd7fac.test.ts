import { detectDiscrepancies, ToleranceCriteriaNotFound } from '../../src/logic/discrepancy-detection-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-027: 差異許容基準の取得に失敗した場合、エラーで処理が中断される', () => {
  it('差異許容基準がnullの場合、ToleranceCriteriaNotFoundエラーが発生する', async () => {
    const legacyInvoices = [
      {
        invoiceId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: null as any,
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
      { salesId: 'SALES001', recordCount: 5, totalAmount: 500000, status: 'closed_won' },
    ];

    const newSystemSalesData = [
      { salesId: 'SALES001', recordCount: 5, totalAmount: 500000, status: 'closed_won' },
    ];

    const detectionTimestamp = '2024-01-20T10:30:00Z';

    (toleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(null);

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow(ToleranceCriteriaNotFound);

    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow('差異許容基準が取得できません。許容範囲判定が実行できません。');
  });
});
