import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('retrieveLegacyAndNewSystemInvoiceData - SCEN-587', () => {
  it('should classify differences exceeding tolerance as 要対応 and prepare for cause investigation', async () => {
    const periodStart = '2024-01-01';
    const periodEnd = '2024-01-31';
    const dealIdRange = { startDealId: 'DEAL001', endDealId: 'DEAL100' };

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.legacyInvoices[0].invoiceId).toBe('INV-SF-001');
    expect(result.legacyInvoices[0].dealId).toBe('DEAL050');
    expect(result.legacyInvoices[0].invoiceAmount).toBe(100000);
    expect(result.legacyInvoices[0].invoiceStatus).toBe('確定');

    expect(result.legacyInvoices[1].invoiceId).toBe('INV-SF-002');
    expect(result.legacyInvoices[1].dealId).toBe('DEAL051');
    expect(result.legacyInvoices[1].invoiceAmount).toBe(150000);
    expect(result.legacyInvoices[1].invoiceStatus).toBe('確定');

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices[0].invoiceId).toBe('INV-NEW-001');
    expect(result.newSystemInvoices[0].dealId).toBe('DEAL050');
    expect(result.newSystemInvoices[0].invoiceAmount).toBe(105000);
    expect(result.newSystemInvoices[0].invoiceStatus).toBe('送付済み');

    expect(result.newSystemInvoices[1].invoiceId).toBe('INV-NEW-002');
    expect(result.newSystemInvoices[1].dealId).toBe('DEAL051');
    expect(result.newSystemInvoices[1].invoiceAmount).toBe(155000);
    expect(result.newSystemInvoices[1].invoiceStatus).toBe('送付済み');

    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[0].dealId).toBe('DEAL050');
    expect(result.normalizedComparisonData[0].amountDifference).toBe(5000);
    expect(result.normalizedComparisonData[0].legacyInvoiceAmount).toBe(100000);
    expect(result.normalizedComparisonData[0].newSystemInvoiceAmount).toBe(105000);
    expect(result.normalizedComparisonData[0].classification).toBe('要対応');

    expect(result.normalizedComparisonData[1].dealId).toBe('DEAL051');
    expect(result.normalizedComparisonData[1].amountDifference).toBe(5000);
    expect(result.normalizedComparisonData[1].legacyInvoiceAmount).toBe(150000);
    expect(result.normalizedComparisonData[1].newSystemInvoiceAmount).toBe(155000);
    expect(result.normalizedComparisonData[1].classification).toBe('要対応');

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
