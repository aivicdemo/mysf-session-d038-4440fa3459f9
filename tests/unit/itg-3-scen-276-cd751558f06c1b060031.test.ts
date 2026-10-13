import { retrieveLegacyAndNewSystemSalesData, NewSystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-276: 新システムからの営業データ取得が失敗した場合、新システムデータ取得失敗エラーを発生させる', () => {
  it('should raise NewSystemDataRetrievalFailure error when new system fetch fails', async () => {
    const input = {
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: null
    };

    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow(NewSystemDataRetrievalFailure);
    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow('新システムからの営業データ取得に失敗しました。新システムの接続状態を確認してください。');
  });
});
