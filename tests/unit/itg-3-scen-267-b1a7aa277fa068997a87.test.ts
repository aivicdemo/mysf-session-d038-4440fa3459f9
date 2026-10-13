import { retrieveLegacyAndNewSystemInvoiceData, NewSystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-267: 新システムステータス定義エラーの処理', () => {
  it('新システムに存在しない商談ステータスが指定された場合、NewSystemDataRetrievalFailure エラーをスロー', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      }),
    ).rejects.toThrow(NewSystemDataRetrievalFailure);
  });
});
