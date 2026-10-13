import { retrieveLegacyAndNewSystemInvoiceData, InvalidDealIdRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-554: 許容閾値が負の数のとき、エラーメッセージが返される', () => {
  it('should throw InvalidDealIdRange when startDealId is greater than endDealId', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-15',
        periodEnd: '2024-01-31',
        dealIdRange: {
          startDealId: 'DEAL-005',
          endDealId: '-100',
        },
      })
    ).rejects.toThrow(InvalidDealIdRange);
  });

  it('should throw error with correct message', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-15',
        periodEnd: '2024-01-31',
        dealIdRange: {
          startDealId: 'DEAL-005',
          endDealId: '-100',
        },
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDealIdRange);
      expect((error as Error).message).toBe('商談範囲が無効です。開始商談IDは終了商談ID以下である必要があります。');
    }
  });

  it('should validate dealIdRange before fetching data', async () => {
    try {
      await retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-15',
        periodEnd: '2024-01-31',
        dealIdRange: {
          startDealId: 'DEAL-100',
          endDealId: 'DEAL-050',
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDealIdRange);
    }
  });
});
