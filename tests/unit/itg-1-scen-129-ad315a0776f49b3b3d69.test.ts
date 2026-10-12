import { modifyInvoice, InvalidLineItemModification } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));
jest.mock('../../src/logic/modification-tracking', () => ({
  ...jest.requireActual<typeof import('../../src/logic/modification-tracking')>('../../src/logic/modification-tracking'),
}));
jest.mock('../../src/logic/audit-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-logging')>('../../src/logic/audit-logging'),
}));

describe('SCEN-129: 修正対象の請求明細の修正内容が不正である場合、InvalidLineItemModificationエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidLineItemModification when lineItemId does not exist', async () => {
    const mockFetchInvoiceById = jest.spyOn(dataPersistence, 'fetchInvoiceById').mockResolvedValue({
      invoiceId: 'INV-20250107-001',
      invoiceNumber: 'INV20250107001',
      invoiceStatus: 'draft',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
    } as any);

    const mockFetchInvoiceWithLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems').mockResolvedValue([
      {
        lineItemId: 'LINE-001',
        quantity: 10,
        unitPrice: 5000,
        taxRate: 0.1,
        lineAmount: 50000,
      },
      {
        lineItemId: 'LINE-002',
        quantity: 10,
        unitPrice: 5000,
        taxRate: 0.1,
        lineAmount: 50000,
      },
    ] as any);

    const input = {
      invoiceId: 'INV-20250107-001',
      modifiedLineItems: [
        {
          lineItemId: 'LINE-NONEXISTENT-999',
          quantity: 5,
          unitPrice: 1000,
        },
      ],
      modificationReason: '数量誤りを訂正',
      currentDateTime: new Date('2025-01-07T10:30:00Z'),
      executingUserId: 'USER-SALES-001',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvalidLineItemModification);
    expect(mockFetchInvoiceById).toHaveBeenCalledWith('INV-20250107-001');
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith('INV-20250107-001');
  });
});
