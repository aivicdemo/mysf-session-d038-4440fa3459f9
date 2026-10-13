import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('retrieveLegacyAndNewSystemInvoiceData - SCEN-588', () => {
  it('should throw DataNormalizationFailure when normalization process fails', async () => {
    const periodStart = '2025-01-01';
    const periodEnd = '2025-01-31';
    const dealIdRange = null;

    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart,
        periodEnd,
        dealIdRange,
      })
    ).rejects.toThrow(DataNormalizationFailure);
  });
});
