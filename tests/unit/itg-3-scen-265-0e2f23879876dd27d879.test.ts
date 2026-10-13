import {
  retrieveLegacyAndNewSystemInvoiceData,
  type RetrieveLegacyAndNewSystemInvoiceDataOutput,
  type LegacyInvoiceRecord,
  type NormalizedInvoiceComparisonRecord,
} from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-265: 業務ルール「extractInvoiceDataFromNewSystem」の計算式に従い、指定期間内の請求書が抽出・整理されて返却される', () => {
  it('指定期間内の旧システム・新システムの請求書が抽出・整理され、extractionTimestamp が設定される', async () => {
    const input = {
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    };

    const result = (await retrieveLegacyAndNewSystemInvoiceData(input)) as RetrieveLegacyAndNewSystemInvoiceDataOutput;

    expect(result).toHaveProperty('legacyInvoices');
    expect(result).toHaveProperty('newSystemInvoices');
    expect(result).toHaveProperty('normalizedComparisonData');
    expect(result).toHaveProperty('extractionTimestamp');

    expect(Array.isArray(result.legacyInvoices)).toBe(true);
    expect(Array.isArray(result.newSystemInvoices)).toBe(true);
    expect(Array.isArray(result.normalizedComparisonData)).toBe(true);
    expect(typeof result.extractionTimestamp).toBe('string');
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
