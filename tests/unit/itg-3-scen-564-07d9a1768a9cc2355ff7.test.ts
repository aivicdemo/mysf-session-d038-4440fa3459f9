import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-564: 検出された差異が空の場合、監視完了が記録される', () => {
  it('差異が空の場合、空配列を返す', async () => {
    const input = {
      periodStart: '2024-11-01',
      periodEnd: '2024-11-30',
      dealIdRange: null
    };

    const output = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(output.legacyInvoices).toEqual([]);
    expect(output.newSystemInvoices).toEqual([]);
    expect(output.normalizedComparisonData).toEqual([]);
    expect(output.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
