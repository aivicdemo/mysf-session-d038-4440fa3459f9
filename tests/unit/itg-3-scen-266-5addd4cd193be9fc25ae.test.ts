import { retrieveLegacyAndNewSystemInvoiceData, InvalidPeriodRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-266: 抽出開始日が抽出終了日より後である場合、制約1により期間指定エラーが発生する', () => {
  it('periodStart（2024-12-31）が periodEnd（2024-12-25）より後の日付である場合、InvalidPeriodRange エラーが throw される', async () => {
    const input = {
      periodStart: '2024-12-31',
      periodEnd: '2024-12-25',
      dealIdRange: undefined,
    };

    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(InvalidPeriodRange);
    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(
      '請求書抽出期間が無効です。開始日は終了日より前である必要があります。'
    );
  });
});
