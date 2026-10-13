import { retrieveLegacyAndNewSystemSalesData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-277: 取得した営業データの正規化処理が失敗した場合、データ正規化失敗エラーを発生させる', () => {
  it('should raise DataNormalizationFailure error when normalization fails', async () => {
    const input = {
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: null
    };

    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow(DataNormalizationFailure);
    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow('営業データの正規化に失敗しました。データ形式を確認してください。');
  });
});
