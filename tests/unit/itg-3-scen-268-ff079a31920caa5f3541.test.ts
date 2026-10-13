import { retrieveLegacyAndNewSystemInvoiceData, NewSystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-268: 新システムへの接続失敗エラー処理', () => {
  it('新システムへの接続に失敗した場合、NewSystemDataRetrievalFailure エラーをスロー', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      }),
    ).rejects.toThrow(NewSystemDataRetrievalFailure);
  });
});
