import { retrieveLegacyAndNewSystemInvoiceData, NewSystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-251: 新システム請求書データ取得が失敗した場合、新システムデータ取得失敗エラーが発生する', () => {
  it('should throw NewSystemDataRetrievalFailure when data retrieval fails', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow();
  });
});
