import { retrieveLegacyAndNewSystemInvoiceData, NewSystemDataRetrievalFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('retrieveLegacyAndNewSystemInvoiceData - SCEN-561', () => {
  it('新システムのデータが空の場合、NewSystemDataRetrievalFailure エラーが throw される', async () => {
    const input = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(NewSystemDataRetrievalFailure);
    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(
      '新システムから請求書データを取得できませんでした。新システムの接続状態を確認してください。'
    );
  });
});
