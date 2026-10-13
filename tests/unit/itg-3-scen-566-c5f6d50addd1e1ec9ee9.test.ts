import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-566: 差異の絶対値が負の数の場合、エラーメッセージが返される', () => {
  it('差異の絶対値が負の数の場合、DataNormalizationFailure エラーが発生する', async () => {
    const input = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: null
    };

    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(DataNormalizationFailure);
    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow('請求書データの正規化に失敗しました。データ形式を確認してください。');
  });
});
