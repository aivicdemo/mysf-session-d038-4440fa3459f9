import { describe, it, expect } from '@jest/globals';
import {
  retrieveLegacyAndNewSystemInvoiceData,
} from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-262: ISO 8601形式の不正な開始日が入力された場合', () => {
  it('期間指定エラーが発生する', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-13-01',
        periodEnd: '2024-01-31',
        dealIdRange: undefined,
      }),
    ).rejects.toThrow();
  });
});
