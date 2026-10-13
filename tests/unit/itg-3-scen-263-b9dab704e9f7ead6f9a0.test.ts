import { retrieveLegacyAndNewSystemInvoiceData, InvalidPeriodRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-263: ISO 8601形式の不正な終了日が入力された場合、期間指定エラーが発生する', () => {
  it('periodStart が periodEnd より後の日付である場合、InvalidPeriodRange エラーが throw される', async () => {
    const input = {
      periodStart: '2024-01-15',
      periodEnd: '2024-01-10',
      dealIdRange: undefined,
    };

    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(InvalidPeriodRange);
    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(
      '請求書抽出期間が無効です。開始日は終了日より前である必要があります。'
    );
  });
});
