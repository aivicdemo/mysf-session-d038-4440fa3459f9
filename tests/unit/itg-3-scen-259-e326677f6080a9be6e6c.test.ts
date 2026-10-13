import { describe, it, expect } from '@jest/globals';
import {
  retrieveLegacyAndNewSystemInvoiceData,
} from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-259: 商談範囲指定時に開始商談IDと終了商談IDが同一である場合', () => {
  it('正常に処理され、統合・整理されたデータが返却される', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: { startDealId: 'DEAL-12345', endDealId: 'DEAL-12345' },
    });

    expect(result).toBeDefined();
    expect(result.legacyInvoices).toBeDefined();
    expect(result.newSystemInvoices).toBeDefined();
    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.extractionTimestamp).toBeDefined();

    expect(Array.isArray(result.legacyInvoices)).toBe(true);
    expect(Array.isArray(result.newSystemInvoices)).toBe(true);
    expect(Array.isArray(result.normalizedComparisonData)).toBe(true);

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
