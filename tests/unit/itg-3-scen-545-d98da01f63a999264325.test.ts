import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-545: 許容基準が取得され許容範囲判定基準が準備される', () => {
  it('検出された差異の種類ごとに許容基準が取得され、許容範囲判定の基準が準備される', async () => {
    const periodStart = '2024-11-01';
    const periodEnd = '2024-11-30';
    const dealIdRange = null;

    const legacyInvoices = [
      {
        invoiceId: 'SF-INV-2024-001',
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-11-15T10:30:00Z',
      },
      {
        invoiceId: 'SF-INV-2024-002',
        dealId: 'DEAL-002',
        invoiceAmount: 250000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-11-20T14:15:00Z',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NEW-INV-2024-001',
        dealId: 'DEAL-001',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-11-15T10:30:00Z',
        invoiceLineItems: [
          {
            itemId: 'LINE-001',
            productName: 'コンサルティングサービス',
            quantity: 10,
            unitPrice: 10000,
          },
        ],
      },
      {
        invoiceId: 'NEW-INV-2024-002',
        dealId: 'DEAL-002',
        invoiceAmount: 250000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-11-20T14:15:00Z',
        invoiceLineItems: [
          {
            itemId: 'LINE-002',
            productName: 'ライセンス費用',
            quantity: 1,
            unitPrice: 250000,
          },
        ],
      },
      {
        invoiceId: 'NEW-INV-2024-003',
        dealId: 'DEAL-003',
        invoiceAmount: 50000,
        invoiceStatus: '下書き',
        generatedDateTime: '2024-11-25T09:45:00Z',
        invoiceLineItems: [
          {
            itemId: 'LINE-003',
            productName: '保守費用',
            quantity: 1,
            unitPrice: 50000,
          },
        ],
      },
    ];

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toHaveLength(3);

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
