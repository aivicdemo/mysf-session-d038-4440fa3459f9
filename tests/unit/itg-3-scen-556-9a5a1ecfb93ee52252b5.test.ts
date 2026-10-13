import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-556: 差異の種類が空または未定義のとき、エラーメッセージが返される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'INV-001',
      dealId: 'DEAL-001',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-15T10:30:00Z',
    },
  ];

  const mockNewSystemInvoices = [
    {
      invoiceId: 'NEW-INV-001',
      dealId: 'DEAL-001',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-15T10:30:00Z',
    },
  ];

  const mockNormalizedDataWithNullDifferenceType = {
    normalizedRecords: [
      {
        dealId: 'DEAL-001',
        legacyInvoiceId: 'INV-001',
        newSystemInvoiceId: 'NEW-INV-001',
        invoiceAmount: 100000,
        differenceType: null,
      },
    ],
    extractionTimestamp: '2025-01-31T23:59:59Z',
  };


  it('should throw DataNormalizationFailure when differenceType is null', async () => {
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

  it('should validate differenceType field', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(DataNormalizationFailure);
    }

    expect(normalizeRetrievedDataForComparison).toHaveBeenCalled();
  });
});
