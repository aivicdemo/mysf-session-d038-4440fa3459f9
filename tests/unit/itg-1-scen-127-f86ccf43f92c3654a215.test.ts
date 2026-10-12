import { modifyInvoice, ModificationReasonMissing } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-127: 修正理由が空文字列である場合、ModificationReasonMissingエラーが発生する', () => {
  it('空文字列の修正理由で ModificationReasonMissing エラーをスロー', async () => {
    const mockFetchInvoice = jest.spyOn(dataPersistence, 'fetchInvoiceById');

    mockFetchInvoice.mockResolvedValue({
      invoiceId: 'INV-20250107-001',
      invoiceNumber: '2025-001',
      invoiceStatus: 'draft',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
    } as any);

    const input = {
      invoiceId: 'INV-20250107-001',
      modifiedLineItems: [
        { lineItemId: 'LINE-001', quantity: 10 },
      ],
      modificationReason: '',
      currentDateTime: new Date('2025-01-07T14:30:00Z'),
      executingUserId: 'USER-12345',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(ModificationReasonMissing);
    await expect(modifyInvoice(input)).rejects.toThrow('修正理由は必須です。');
  });
});
