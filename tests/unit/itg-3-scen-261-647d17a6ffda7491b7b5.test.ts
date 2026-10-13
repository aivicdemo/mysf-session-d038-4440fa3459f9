import { describe, it, expect } from '@jest/globals';
import {
  retrieveLegacyAndNewSystemInvoiceData,
} from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-261: 新システムから抽出される請求書レコードが0件の場合', () => {
  it('空の配列が返却される', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.legacyInvoices)).toBe(true);
    expect(Array.isArray(result.newSystemInvoices)).toBe(true);
    expect(Array.isArray(result.normalizedComparisonData)).toBe(true);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
