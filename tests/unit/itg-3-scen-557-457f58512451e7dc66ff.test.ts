import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-557: 差異の数値が負の値のとき、エラーメッセージが返される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'SF-INV-001',
      dealId: 'D-001',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2024-01-15T10:30:00Z',
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-INV-001',
      dealId: 'D-001',
      invoiceAmount: 105000,
      invoiceStatus: '確定',
      generatedDateTime: '2024-01-15T10:30:00Z',
    },
  ];

  const mockNormalizedDataWithNegativeAmount = [
    {
      dealId: 'D-001',
      legacyInvoiceAmount: 100000,
      newSystemInvoiceAmount: 105000,
      amountDifference: -5000,
      legacyInvoiceStatus: '確定',
      newSystemInvoiceStatus: '確定',
      statusMatch: true,
    },
  ];


  it('should throw DataNormalizationFailure when amountDifference is negative', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(DataNormalizationFailure);
  });

  it('should throw error with correct message for negative amount difference', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        dealIdRange: undefined,
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(DataNormalizationFailure);
      expect((error as Error).message).toBe('請求書データの正規化に失敗しました。データ形式を確認してください。');
    }
  });

  it('should validate normalized data format', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        dealIdRange: undefined,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(DataNormalizationFailure);
    }

    expect(normalizeRetrievedDataForComparison).toHaveBeenCalled();
  });
});
