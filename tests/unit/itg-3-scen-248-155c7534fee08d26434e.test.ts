import { retrieveLegacyAndNewSystemInvoiceData, InvalidPeriodRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-248: 抽出開始日が終了日以降の場合、期間指定エラーが発生する', () => {
  it('should throw InvalidPeriodRange when periodStart is after periodEnd', async () => {
    await expect(
      retrieveLegacyAndNewSystemInvoiceData({
        periodStart: '2024-12-31',
        periodEnd: '2024-12-25',
        dealIdRange: undefined,
      })
    ).rejects.toThrow(InvalidPeriodRange);
  });
});
