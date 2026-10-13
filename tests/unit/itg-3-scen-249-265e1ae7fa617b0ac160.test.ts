import { retrieveLegacyAndNewSystemInvoiceData, InvalidDealIdRangeError } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-249: 商談範囲指定時に開始商談IDが終了商談IDより大きい場合、商談範囲指定エラーが発生する', () => {
  it('should throw InvalidDealIdRangeError when startDealId is greater than endDealId', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        dealIdRange: {
          startDealId: 'DEAL-00100',
          endDealId: 'DEAL-00050',
        },
      })
    ).rejects.toThrow(InvalidDealIdRangeError);
  });
});
