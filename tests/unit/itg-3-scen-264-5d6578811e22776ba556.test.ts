import { retrieveLegacyAndNewSystemInvoiceData, InvalidDealIdRange } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-264: 商談範囲指定時に不正な形式の商談IDが入力された場合、商談範囲指定エラーが発生する', () => {
  it('startDealId が endDealId より大きい場合、InvalidDealIdRange エラーが throw される', async () => {
    const input = {
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: { startDealId: 'DEAL-9999', endDealId: 'DEAL-0001' },
    };

    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(InvalidDealIdRange);
    await expect(retrieveLegacyAndNewSystemInvoiceData(input)).rejects.toThrow(
      '商談範囲が無効です。開始商談IDは終了商談ID以下である必要があります。'
    );
  });
});
