import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-549: 差異の重大度に基づいてエスカレーション基準に従い段階的に報告・是正指示が生成される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'SF-2024-001',
      dealId: 'DEAL-100',
      invoiceAmount: 100000,
      invoiceStatus: 'confirmed',
      generatedDateTime: '2024-09-15T10:30:00Z',
      invoiceLineItems: [{ itemName: 'Product A', quantity: 2, unitPrice: 50000, subtotal: 100000 }],
    },
    {
      invoiceId: 'SF-2024-002',
      dealId: 'DEAL-101',
      invoiceAmount: 50000,
      invoiceStatus: 'confirmed',
      generatedDateTime: '2024-09-20T14:45:00Z',
      invoiceLineItems: [{ itemName: 'Product B', quantity: 1, unitPrice: 50000, subtotal: 50000 }],
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-2024-001',
      dealId: 'DEAL-100',
      invoiceAmount: 100000,
      invoiceStatus: 'sent',
      generatedDateTime: '2024-09-15T10:30:00Z',
      invoiceLineItems: [{ itemName: 'Product A', quantity: 2, unitPrice: 50000, subtotal: 100000 }],
    },
    {
      invoiceId: 'NEW-2024-003',
      dealId: 'DEAL-102',
      invoiceAmount: 75000,
      invoiceStatus: 'draft',
      generatedDateTime: '2024-09-25T09:15:00Z',
      invoiceLineItems: [{ itemName: 'Product C', quantity: 3, unitPrice: 25000, subtotal: 75000 }],
    },
  ];

  const mockNormalizedData = [
    {
      dealId: 'DEAL-100',
      legacyInvoiceId: 'SF-2024-001',
      newSystemInvoiceId: 'NEW-2024-001',
      legacyAmount: 100000,
      newSystemAmount: 100000,
      amountDifference: 0,
      legacyStatus: 'confirmed',
      newSystemStatus: 'sent',
      statusMatch: false,
      matchType: 'matched_with_difference',
    },
    {
      dealId: 'DEAL-101',
      legacyInvoiceId: 'SF-2024-002',
      newSystemInvoiceId: null,
      legacyAmount: 50000,
      newSystemAmount: null,
      amountDifference: null,
      legacyStatus: 'confirmed',
      newSystemStatus: null,
      statusMatch: false,
      matchType: 'legacy_only',
    },
    {
      dealId: 'DEAL-102',
      legacyInvoiceId: null,
      newSystemInvoiceId: 'NEW-2024-003',
      legacyAmount: null,
      newSystemAmount: 75000,
      amountDifference: null,
      legacyStatus: null,
      newSystemStatus: 'draft',
      statusMatch: false,
      matchType: 'new_system_only',
    },
  ];


  it('should retrieve legacy and new system invoice data with escalation analysis', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-09-01',
      periodEnd: '2024-09-30',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toEqual(mockLegacyInvoices);
    expect(result.newSystemInvoices).toEqual(mockNewSystemInvoices);
    expect(result.normalizedComparisonData).toEqual(mockNormalizedData);
    expect(result.extractionTimestamp).toBeDefined();

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });

  it('should include detected discrepancies in normalized data', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-09-01',
      periodEnd: '2024-09-30',
      dealIdRange: undefined,
    });

    const normalizedData = result.normalizedComparisonData;

    const deal100 = normalizedData.find(d => d.dealId === 'DEAL-100');
    expect(deal100?.matchType).toBe('matched_with_difference');
    expect(deal100?.statusMatch).toBe(false);

    const deal101 = normalizedData.find(d => d.dealId === 'DEAL-101');
    expect(deal101?.matchType).toBe('legacy_only');

    const deal102 = normalizedData.find(d => d.dealId === 'DEAL-102');
    expect(deal102?.matchType).toBe('new_system_only');
  });
});
