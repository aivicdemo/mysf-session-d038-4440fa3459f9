import { retrieveLegacyAndNewSystemSalesData, LegacySystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-275: 旧システムからの営業データ取得が失敗した場合、旧システムデータ取得失敗エラーを発生させる', () => {
  it('should raise LegacySystemDataRetrievalFailure error when legacy system fetch fails', async () => {
    const input = {
      periodStart: '2024-01-01T00:00:00Z',
      periodEnd: '2024-01-31T23:59:59Z',
      dealIdRange: null
    };

    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow(LegacySystemDataRetrievalFailure);
    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow('旧システムからの営業データ取得に失敗しました。旧システムの接続状態を確認してください。');
  });
});
