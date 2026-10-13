import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-565: 月次締め日が設定されていない場合、警告が記録される', () => {
  it('正規化済み照合対象データに警告情報を含むレコードが含まれる', async () => {
    const input = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: null
    };

    const output = await retrieveLegacyAndNewSystemInvoiceData(input);

    expect(output.legacyInvoices).toHaveLength(1);
    expect(output.legacyInvoices[0].invoiceId).toBe('INV-20250115-001');
    expect(output.newSystemInvoices).toHaveLength(1);
    expect(output.newSystemInvoices[0].invoiceId).toBe('INV-NEW-20250115-001');
    expect(output.normalizedComparisonData).toHaveLength(1);
    expect(output.normalizedComparisonData[0].dealId).toBe('DEAL-00001');
    const comparisonRecord = output.normalizedComparisonData[0];
    expect(comparisonRecord).toHaveProperty('warning');
    expect((comparisonRecord as any).warning).toBe('月次締め日が旧システムで未設定です');
    expect(output.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
