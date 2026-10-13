import { retrieveLegacyAndNewSystemInvoiceData, DataNormalizationFailure } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-553: 新システムのデータスナップショットが空のとき、エラーメッセージが返される', () => {
  const mockLegacyInvoices = [
    {
      invoiceId: 'INV-001',
      dealId: 'DEAL-001',
      invoiceAmount: 100000,
      invoiceStatus: '確定',
      generatedDateTime: '2025-01-15T10:30:00Z',
      invoiceLineItems: [{ lineItemId: 'LINE-001', productName: 'サービスA', quantity: 1, unitPrice: 100000, subtotal: 100000 }],
    },
  ];


  it('should throw DataNormalizationFailure when new system data is empty', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(DataNormalizationFailure);
  });

  it('should throw error with correct message when normalization fails', async () => {
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

  it('should retrieve legacy data but fail on normalization', async () => {
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
  });
});
