import { retrieveLegacyAndNewSystemInvoiceData, InvalidPeriodRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-258: 抽出開始日と終了日が同一日である場合、期間指定エラーが発生する', () => {
  it('should throw InvalidPeriodRange when periodStart equals periodEnd', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-01-15',
        periodEnd: '2024-01-15',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(InvalidPeriodRange);
  });
});
