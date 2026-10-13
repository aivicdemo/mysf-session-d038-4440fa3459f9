import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-559: 全データ件数が0のとき、エラーメッセージが返される', () => {

  it('should throw DataNormalizationFailure when all data counts are zero', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(DataNormalizationFailure);
  });

  it('should throw error with correct message', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(DataNormalizationFailure);
      expect((error as Error).message).toBe('請求書データの正規化に失敗しました。データ形式を確認してください。');
    }
  });

  it('should call all fetch functions even with zero data', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      });
    } catch {
      // Expected to throw
    }

    expect(fetchLegacySystemInvoiceRecords).toHaveBeenCalled();
    expect(fetchNewSystemInvoiceRecords).toHaveBeenCalled();
    expect(normalizeRetrievedDataForComparison).toHaveBeenCalled();
  });

  it('should provide clear error notification to user', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(DataNormalizationFailure);
      const message = (error as Error).message;
      expect(message).toContain('請求書データ');
      expect(message).toContain('正規化に失敗');
    }
  });
});
