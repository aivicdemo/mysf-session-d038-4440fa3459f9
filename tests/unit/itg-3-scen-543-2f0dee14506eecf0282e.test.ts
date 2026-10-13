import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-543: 請求書データ取得後に営業データを取得', () => {
  it('請求書データ取得後に営業データ（件数・金額・ステータス）を取得し、差異検出の入力データが整備される', async () => {
    const periodStart = '2024-01-01';
    const periodEnd = '2024-01-31';
    const dealIdRange = null;

    const legacyInvoices = [
      {
        invoiceId: 'SF-INV-2024-0001',
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-15T10:30:00Z',
        invoiceLineItems: [],
      },
      {
        invoiceId: 'SF-INV-2024-0002',
        dealId: 'DEAL-002',
        invoiceAmount: 250000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2024-01-20T14:00:00Z',
        invoiceLineItems: [],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NS-INV-2024-0001',
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-15T10:30:00Z',
        invoiceLineItems: [
          {
            productName: 'ライセンス',
            quantity: 1,
            unitPrice: 100000,
            subtotal: 100000,
          },
        ],
      },
      {
        invoiceId: 'NS-INV-2024-0002',
        dealId: 'DEAL-002',
        invoiceAmount: 250000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2024-01-20T14:00:00Z',
        invoiceLineItems: [
          {
            productName: 'サービス',
            quantity: 2,
            unitPrice: 125000,
            subtotal: 250000,
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
    expect(result.legacyInvoices[0].invoiceId).toBe('SF-INV-2024-0001');
    expect(result.legacyInvoices[0].invoiceAmount).toBe(100000);
    expect(result.legacyInvoices[0].invoiceStatus).toBe('確定');
    expect(result.legacyInvoices[1].invoiceId).toBe('SF-INV-2024-0002');
    expect(result.legacyInvoices[1].invoiceAmount).toBe(250000);

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices[0].invoiceId).toBe('NS-INV-2024-0001');
    expect(result.newSystemInvoices[0].invoiceAmount).toBe(100000);
    expect(result.newSystemInvoices[0].invoiceStatus).toBe('確定');
    expect(result.newSystemInvoices[1].invoiceId).toBe('NS-INV-2024-0002');
    expect(result.newSystemInvoices[1].invoiceAmount).toBe(250000);

    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[0]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        legacyAmount: 100000,
        newSystemAmount: 100000,
      })
    );
    expect(result.normalizedComparisonData[1]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-002',
        legacyAmount: 250000,
        newSystemAmount: 250000,
      })
    );

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
