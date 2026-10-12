import { modifyInvoice, InvoiceNotFound } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-125: 指定された請求書IDが存在しない場合、InvoiceNotFoundエラーが発生する', () => {
  it('存在しない請求書IDで InvoiceNotFound エラーをスロー', async () => {
    const mockFetchInvoice = jest.spyOn(dataPersistence, 'fetchInvoiceById');

    mockFetchInvoice.mockResolvedValue(null);

    const input = {
      invoiceId: 'INV-999999',
      modifiedLineItems: [
        { lineItemId: 'LI-001', quantity: 10 },
      ],
      modificationReason: '顧客からの数量訂正依頼',
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvoiceNotFound);
    await expect(modifyInvoice(input)).rejects.toThrow('修正対象の請求書が見つかりません。');

    expect(mockFetchInvoice).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: 'INV-999999' }));
  });
});
