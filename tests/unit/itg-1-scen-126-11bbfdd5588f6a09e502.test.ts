import { modifyInvoice, InvoiceNotModifiable } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-126: 請求書のステータスが修正不可の状態である場合、InvoiceNotModifiableエラーが発生する', () => {
  it('修正不可ステータス（paid）で InvoiceNotModifiable エラーをスロー', async () => {
    const mockFetchInvoice = jest.spyOn(dataPersistence, 'fetchInvoiceById');

    mockFetchInvoice.mockResolvedValue({
      invoiceId: 'INV-20250107-001',
      invoiceNumber: '2025-00001',
      invoiceStatus: 'paid',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      createdAt: '2025-01-05T10:00:00Z',
    } as any);

    const input = {
      invoiceId: 'INV-20250107-001',
      modifiedLineItems: [
        { lineItemId: 'LINE-001', quantity: 10 },
      ],
      modificationReason: '数量修正：顧客からの修正依頼',
      currentDateTime: new Date('2025-01-07T14:30:00Z'),
      executingUserId: 'USER-12345',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvoiceNotModifiable);
    await expect(modifyInvoice(input)).rejects.toThrow('このステータスの請求書は修正できません。');

    expect(mockFetchInvoice).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: 'INV-20250107-001' }));
  });
});
