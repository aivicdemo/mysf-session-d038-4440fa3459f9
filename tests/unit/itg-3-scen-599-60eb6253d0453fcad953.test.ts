import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-599: ステータスが『請求済み』または『未請求』に関わるとき、優先度が『緊急』に設定される', () => {
  it('旧システムのステータスが「請求済み」または「未請求」のレコードの優先度が「緊急」に設定されている', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.normalizedComparisonData.length).toBe(2);

    const deal100Record = result.normalizedComparisonData.find(
      (r) => r.dealId === 'DEAL-100'
    );
    expect(deal100Record).toBeDefined();
    expect(deal100Record?.legacyInvoiceStatus).toBe('請求済み');
    expect(deal100Record?.priority).toBe('緊急');

    const deal101Record = result.normalizedComparisonData.find(
      (r) => r.dealId === 'DEAL-101'
    );
    expect(deal101Record).toBeDefined();
    expect(deal101Record?.legacyInvoiceStatus).toBe('未請求');
    expect(deal101Record?.priority).toBe('緊急');

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
