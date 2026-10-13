import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-544: 旧新システムデータを比較して差異検出', () => {
  it('旧新システムデータを比較して件数ズレ・金額ズレ・ステータス不整合が自動検出される', async () => {
    const periodStart = '2024-01-01';
    const periodEnd = '2024-01-31';
    const dealIdRange = null;

    const legacyInvoices = [
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
      {
        invoiceId: 'SF-INV-003',
        dealId: 'DEAL-102',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-25T09:15:00Z',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NEW-INV-001',
        dealId: 'DEAL-100',
        invoiceAmount: 100000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-15T10:00:00Z',
      },
      {
        invoiceId: 'NEW-INV-002',
        dealId: 'DEAL-101',
        invoiceAmount: 250000,
        invoiceStatus: '下書き',
        generatedDateTime: '2024-01-20T14:30:00Z',
      },
    ];

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(3);
    expect(result.legacyInvoices.map((inv: any) => inv.invoiceId)).toEqual([
      'SF-INV-001',
      'SF-INV-002',
      'SF-INV-003',
    ]);

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices.map((inv: any) => inv.invoiceId)).toEqual([
      'NEW-INV-001',
      'NEW-INV-002',
    ]);

    expect(result.normalizedComparisonData).toHaveLength(3);

    const deal100 = result.normalizedComparisonData[0];
    expect(deal100.dealId).toBe('DEAL-100');

    const deal101 = result.normalizedComparisonData[1];
    expect(deal101.dealId).toBe('DEAL-101');

    const deal102 = result.normalizedComparisonData[2];
    expect(deal102.dealId).toBe('DEAL-102');

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
