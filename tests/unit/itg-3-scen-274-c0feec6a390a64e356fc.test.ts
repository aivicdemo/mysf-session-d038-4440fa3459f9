import { retrieveLegacyAndNewSystemSalesData, InvalidDealIdRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-274: 商談範囲が指定されており開始商談IDが終了商談IDより後の値の場合、商談範囲無効エラーを発生させる', () => {
  it('should raise InvalidDealIdRange error when startDealId is after endDealId', async () => {
    const input = {
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: {
        startDealId: 'DEAL-00200',
        endDealId: 'DEAL-00100'
      }
    };

    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow(InvalidDealIdRange);
    await expect(retrieveLegacyAndNewSystemSalesData(input)).rejects.toThrow('指定された商談範囲が無効です。startDealId は endDealId 以前の値を指定してください。');
  });
});
