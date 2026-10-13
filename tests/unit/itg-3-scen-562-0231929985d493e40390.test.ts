import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('retrieveLegacyAndNewSystemInvoiceData - SCEN-562', () => {
  it('フィールドマッピング定義が不完全な場合、DataNormalizationFailure エラーが発生して警告が記録される', async () => {
    const input = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    };

    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(DataNormalizationFailure);
    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(
      '請求書データの正規化に失敗しました。データ形式を確認してください。'
    );
  });
});
