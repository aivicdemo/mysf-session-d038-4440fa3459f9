import { modifyInvoice, InvalidLineItemModification } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-128: 修正対象の請求明細が存在しない場合、InvalidLineItemModificationエラーが発生する', () => {
  it('存在しない請求明細IDで InvalidLineItemModification エラーをスロー', async () => {
    const mockFetchInvoice = jest.spyOn(dataPersistence, 'fetchInvoiceById');
    const mockFetchLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems');

    mockFetchInvoice.mockResolvedValue({
      invoiceId: 'INV-20240115-001',
      invoiceNumber: '2024-001',
      invoiceStatus: 'draft',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
    } as any);

    mockFetchLineItems.mockResolvedValue({
      lineItemId: 'LINE-EXISTING-001',
      invoiceId: 'INV-20240115-001',
      quantity: 10,
      unitPrice: 5000,
      taxRate: 0.1,
      lineAmount: 50000,
    } as any);

    const input = {
      invoiceId: 'INV-20240115-001',
      modifiedLineItems: [
        { lineItemId: 'LINE-NONEXISTENT-999', quantity: 5 },
      ],
      modificationReason: '数量訂正',
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
      executingUserId: 'USER-SALES-001',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvalidLineItemModification);
    await expect(modifyInvoice(input)).rejects.toThrow('修正対象の請求明細が不正です。');

    expect(mockFetchInvoice).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: 'INV-20240115-001' }));
    expect(mockFetchLineItems).toHaveBeenCalled();
  });
});
