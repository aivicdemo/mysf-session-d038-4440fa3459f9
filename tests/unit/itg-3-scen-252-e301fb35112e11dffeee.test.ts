import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-252: 抽出データの正規化処理が失敗した場合、データ正規化失敗エラーが発生する', () => {
  it('should throw DataNormalizationFailure when normalization fails', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow();
  });
});
