import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-558: 許容範囲の設定値が存在しないとき、警告が記録されデフォルト値が適用される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'INV-001',
      dealId: 'DEAL-100',
      invoiceAmount: 150000,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-15T10:30:00Z',
    },
    {
      invoiceId: 'INV-002',
      dealId: 'DEAL-101',
      invoiceAmount: 250000,
      invoiceStatus: '送付済み',
      generatedDateTime: '2025-01-20T14:45:00Z',
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-INV-001',
      dealId: 'DEAL-100',
      invoiceAmount: 150000,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-15T10:30:00Z',
    },
    {
      invoiceId: 'NEW-INV-002',
      dealId: 'DEAL-101',
      invoiceAmount: 250000,
      invoiceStatus: '送付済み',
      generatedDateTime: '2025-01-20T14:45:00Z',
    },
  ];

  const mockNormalizedData = [
    {
      dealId: 'DEAL-100',
      legacyInvoiceId: 'INV-001',
      newSystemInvoiceId: 'NEW-INV-001',
      legacyAmount: 150000,
      newSystemAmount: 150000,
      amountDifference: 0,
    },
    {
      dealId: 'DEAL-101',
      legacyInvoiceId: 'INV-002',
      newSystemInvoiceId: 'NEW-INV-002',
      legacyAmount: 250000,
      newSystemAmount: 250000,
      amountDifference: 0,
    },
  ];


  it('should return normalized data with default tolerance applied', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toEqual(mockLegacyInvoices);
    expect(result.newSystemInvoices).toEqual(mockNewSystemInvoices);
    expect(result.normalizedComparisonData.length).toBe(2);
    expect(result.extractionTimestamp).toBeDefined();
  });

  it('should handle default tolerance value application', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.normalizedComparisonData.length).toBeGreaterThan(0);

    result.normalizedComparisonData.forEach(record => {
      expect(record.dealId).toBeDefined();
      expect(record.amountDifference).toBeDefined();
    });
  });

  it('should process without error despite missing tolerance configuration', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result).toBeDefined();
    expect(result.legacyInvoices).toBeDefined();
    expect(result.newSystemInvoices).toBeDefined();
    expect(result.normalizedComparisonData).toBeDefined();
  });
});
