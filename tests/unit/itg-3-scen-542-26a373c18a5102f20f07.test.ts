import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-542: 定時データ同期監視と差異自動検出', () => {
  it('定時監視開始時に旧新システムから請求書データを取得し、日次照合の対象データセットが準備される', async () => {
    const periodStart = '2025-01-01';
    const periodEnd = '2025-01-31';
    const dealIdRange = null;

    const legacyInvoices = [
      {
        invoiceId: 'SF-INV-001',
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
        invoiceLineItems: [
          {
            lineItemId: 'LINE-001',
            productName: 'コンサルティング',
            quantity: 1,
            unitPrice: 100000,
            subtotal: 100000,
          },
        ],
      },
      {
        invoiceId: 'SF-INV-002',
        dealId: 'DEAL-002',
        invoiceAmount: 50000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2025-01-20T14:00:00Z',
        invoiceLineItems: [
          {
            lineItemId: 'LINE-002',
            productName: 'サポート',
            quantity: 2,
            unitPrice: 25000,
            subtotal: 50000,
          },
        ],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NEW-INV-001',
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
        invoiceLineItems: [
          {
            lineItemId: 'NEW-LINE-001',
            productName: 'コンサルティング',
            quantity: 1,
            unitPrice: 100000,
            subtotal: 100000,
          },
        ],
      },
      {
        invoiceId: 'NEW-INV-002',
        dealId: 'DEAL-002',
        invoiceAmount: 50000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2025-01-20T14:00:00Z',
        invoiceLineItems: [
          {
            lineItemId: 'NEW-LINE-002',
            productName: 'サポート',
            quantity: 2,
            unitPrice: 25000,
            subtotal: 50000,
          },
        ],
      },
    ];

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.legacyInvoices[0].invoiceId).toBe('SF-INV-001');
    expect(result.legacyInvoices[0].dealId).toBe('DEAL-001');
    expect(result.legacyInvoices[1].invoiceId).toBe('SF-INV-002');

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices[0].invoiceId).toBe('NEW-INV-001');
    expect(result.newSystemInvoices[1].invoiceId).toBe('NEW-INV-002');

    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[0]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
      })
    );
    expect(result.normalizedComparisonData[1]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-002',
        invoiceAmount: 50000,
      })
    );

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
