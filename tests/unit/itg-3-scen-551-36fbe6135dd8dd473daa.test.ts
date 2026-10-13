import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-551: 検出された差異と監視結果がダッシュボードに反映され、営業部システム担当に通知される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'SF-INV-001',
      dealId: 'DEAL-100',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2024-01-15T10:00:00Z',
    },
    {
      invoiceId: 'SF-INV-002',
      dealId: 'DEAL-101',
      invoiceAmount: 250000,
      invoiceStatus: '送付済み',
      generatedDateTime: '2024-01-20T14:30:00Z',
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-INV-001',
      dealId: 'DEAL-100',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2024-01-15T10:00:00Z',
    },
    {
      invoiceId: 'NEW-INV-003',
      dealId: 'DEAL-102',
      invoiceAmount: 150000,
      invoiceStatus: '下書き',
      generatedDateTime: '2024-01-25T09:00:00Z',
    },
  ];

  const mockNormalizedData = [
    {
      matchStatus: 'matched',
      legacyInvoiceId: 'SF-INV-001',
      newSystemInvoiceId: 'NEW-INV-001',
      dealId: 'DEAL-100',
      amountDifference: 0,
      statusDifference: null,
    },
    {
      matchStatus: 'legacy_only',
      legacyInvoiceId: 'SF-INV-002',
      newSystemInvoiceId: null,
      dealId: 'DEAL-101',
      amountDifference: 250000,
      statusDifference: '送付済み',
    },
    {
      matchStatus: 'new_system_only',
      legacyInvoiceId: null,
      newSystemInvoiceId: 'NEW-INV-003',
      dealId: 'DEAL-102',
      amountDifference: 150000,
      statusDifference: '下書き',
    },
  ];


  it('should return discrepancies for dashboard display', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toEqual(mockLegacyInvoices);
    expect(result.newSystemInvoices).toEqual(mockNewSystemInvoices);
    expect(result.normalizedComparisonData).toEqual(mockNormalizedData);
    expect(result.extractionTimestamp).toBeDefined();

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });

  it('should identify matched and unmatched records', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    const normalizedData = result.normalizedComparisonData;

    const matched = normalizedData.find(d => d.dealId === 'DEAL-100');
    expect(matched?.matchStatus).toBe('matched');
    expect(matched?.amountDifference).toBe(0);

    const legacyOnly = normalizedData.find(d => d.dealId === 'DEAL-101');
    expect(legacyOnly?.matchStatus).toBe('legacy_only');
    expect(legacyOnly?.amountDifference).toBe(250000);

    const newSystemOnly = normalizedData.find(d => d.dealId === 'DEAL-102');
    expect(newSystemOnly?.matchStatus).toBe('new_system_only');
    expect(newSystemOnly?.amountDifference).toBe(150000);
  });
});
