import { modifyInvoice, InvalidModificationAmount } from '../../src/logic/invoice-generation-management';
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

describe('SCEN-130: 修正後の金額計算が業務ルールに違反している場合、InvalidModificationAmountエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidModificationAmount when amount validation fails', async () => {
    const mockFetchInvoiceById = jest.spyOn(dataPersistence, 'fetchInvoiceById').mockResolvedValue({
      invoiceId: 'INV-2025-001',
      invoiceNumber: '2025-000001',
      invoiceStatus: 'draft',
      invoiceAmount: 5500,
      taxAmount: 500,
      untaxedAmount: 5000,
    } as any);

    const mockFetchInvoiceWithLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems').mockResolvedValue([
      {
        lineItemId: 'LINE-001',
        quantity: 5,
        unitPrice: 1000,
        taxRate: 0.1,
      },
    ] as any);

    const input = {
      invoiceId: 'INV-2025-001',
      modifiedLineItems: [
        {
          lineItemId: 'LINE-001',
          quantity: 10,
          unitPrice: 1000,
          taxRate: 0.1,
        },
      ],
      modificationReason: '顧客要望による数量・単価の変更',
      currentDateTime: new Date('2025-01-15T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvalidModificationAmount);
    expect(mockFetchInvoiceById).toHaveBeenCalledWith('INV-2025-001');
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith('INV-2025-001');
  });
});
