import { reconcileDealAndInvoice, DealNotFound } from '../../src/logic/deal-invoice-reconciliation';
import type { ReconcileDealAndInvoiceInput } from '../../src/logic/deal-invoice-reconciliation';

describe('SCEN-095: 商談IDが空または不正な形式の場合、エラーを返す', () => {
  it('商談IDが空文字列の場合、DealNotFound エラーを返す', async () => {
    const input: ReconcileDealAndInvoiceInput = {
      dealId: '',
      targetPeriodStart: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-01-31T23:59:59Z'),
    };

    await expect(reconcileDealAndInvoice(input)).rejects.toThrow(DealNotFound);
    await expect(reconcileDealAndInvoice(input)).rejects.toThrow(
      '商談が見つかりません。商談IDを確認してください。'
    );
  });
});
