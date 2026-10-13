import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-550: エスカレーション後の是正実行状況が監視され、SLA内の是正完了が追跡される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'SF-INV-2024-0001',
      dealId: 'DEAL-001',
      invoiceAmount: 150000,
      invoiceStatus: 'confirmed',
      generatedDateTime: '2024-09-05T10:30:00Z',
      invoiceLineItems: [{ lineItemId: 'LINE-001', productName: 'サービス提供', quantity: 1, unitPrice: 150000 }],
    },
    {
      invoiceId: 'SF-INV-2024-0002',
      dealId: 'DEAL-002',
      invoiceAmount: 200000,
      invoiceStatus: 'pending_correction',
      generatedDateTime: '2024-09-10T14:15:00Z',
      invoiceLineItems: [{ lineItemId: 'LINE-002', productName: 'コンサルティング', quantity: 2, unitPrice: 100000 }],
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-INV-2024-0001',
      dealId: 'DEAL-001',
      invoiceAmount: 150000,
      invoiceStatus: 'confirmed',
      generatedDateTime: '2024-09-05T10:30:00Z',
      invoiceLineItems: [{ lineItemId: 'NEW-LINE-001', productName: 'サービス提供', quantity: 1, unitPrice: 150000 }],
    },
    {
      invoiceId: 'NEW-INV-2024-0002',
      dealId: 'DEAL-002',
      invoiceAmount: 200000,
      invoiceStatus: 'confirmed',
      generatedDateTime: '2024-09-10T14:15:00Z',
      invoiceLineItems: [{ lineItemId: 'NEW-LINE-002', productName: 'コンサルティング', quantity: 2, unitPrice: 100000 }],
    },
  ];

  const mockNormalizedData = [
    {
      dealId: 'DEAL-001',
      legacyInvoiceId: 'SF-INV-2024-0001',
      newSystemInvoiceId: 'NEW-INV-2024-0001',
      legacyAmount: 150000,
      newSystemAmount: 150000,
      amountDifference: 0,
      legacyStatus: 'confirmed',
      newSystemStatus: 'confirmed',
      generatedDateTime: '2024-09-05T10:30:00Z',
      normalizationTimestamp: '2024-09-15T09:00:00Z',
    },
    {
      dealId: 'DEAL-002',
      legacyInvoiceId: 'SF-INV-2024-0002',
      newSystemInvoiceId: 'NEW-INV-2024-0002',
      legacyAmount: 200000,
      newSystemAmount: 200000,
      amountDifference: 0,
      legacyStatus: 'pending_correction',
      newSystemStatus: 'confirmed',
      generatedDateTime: '2024-09-10T14:15:00Z',
      normalizationTimestamp: '2024-09-15T09:00:00Z',
      differenceDetected: true,
      differenceType: 'status_mismatch',
      escal_status: 'escalated',
      escal_timestamp: '2024-09-12T16:00:00Z',
      correction_deadline: '2024-09-15T23:59:59Z',
      correction_completion_timestamp: '2024-09-14T11:30:00Z',
      sla_compliance: 'met',
    },
  ];


  it('should track SLA-compliant correction completion', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-09-01',
      periodEnd: '2024-09-30',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toEqual(mockLegacyInvoices);
    expect(result.newSystemInvoices).toEqual(mockNewSystemInvoices);

    const normalizedData = result.normalizedComparisonData;
    const deal002 = normalizedData.find(d => d.dealId === 'DEAL-002');

    expect(deal002?.differenceDetected).toBe(true);
    expect(deal002?.differenceType).toBe('status_mismatch');
    expect(deal002?.escal_status).toBe('escalated');
    expect(deal002?.escal_timestamp).toBe('2024-09-12T16:00:00Z');
    expect(deal002?.correction_deadline).toBe('2024-09-15T23:59:59Z');
    expect(deal002?.correction_completion_timestamp).toBe('2024-09-14T11:30:00Z');
    expect(deal002?.sla_compliance).toBe('met');
  });

  it('should include both matched and escalated records in output', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-09-01',
      periodEnd: '2024-09-30',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData.length).toBe(2);
    expect(result.extractionTimestamp).toBeDefined();

    const timestamp = new Date(result.extractionTimestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
  });
});
