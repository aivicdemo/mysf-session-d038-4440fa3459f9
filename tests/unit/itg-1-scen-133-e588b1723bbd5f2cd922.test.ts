import { modifyInvoice, InvoiceLineItemUpdateFailed } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));
jest.mock('../../src/logic/modification-tracking', () => ({
  ...jest.requireActual<typeof import('../../src/logic/modification-tracking')>('../../src/logic/modification-tracking'),
}));
jest.mock('../../src/logic/audit-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-logging')>('../../src/logic/audit-logging'),
}));

describe('SCEN-133: 請求明細レコードの更新処理が失敗した場合、InvoiceLineItemUpdateFailedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceLineItemUpdateFailed when saveInvoiceLineItem fails', async () => {
    const mockFetchInvoiceById = jest.spyOn(dataPersistence, 'fetchInvoiceById').mockResolvedValue({
      invoiceId: 'INV-20240115-001',
      invoiceNumber: '2024-000001',
      status: 'draft',
      invoiceAmount: 11000,
      taxAmount: 1000,
      untaxedAmount: 10000,
    } as any);

    const mockFetchInvoiceWithLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems').mockResolvedValue([
      {
        lineItemId: 'LINE-001',
        invoiceId: 'INV-20240115-001',
        quantity: 10,
        unitPrice: 1000,
        taxRate: 0.1,
        lineAmount: 10000,
      },
    ] as any);

    const mockRecordModificationWithHistory = jest.spyOn(modificationTracking, 'recordModificationWithHistory')
      .mockResolvedValue({ modificationRecordId: 'MOD-001' } as any);

    const mockSaveInvoice = jest.spyOn(dataPersistence, 'saveInvoice')
      .mockResolvedValue({ invoiceId: 'INV-20240115-001' } as any);

    const mockSaveInvoiceLineItem = jest.spyOn(dataPersistence, 'saveInvoiceLineItem')
      .mockRejectedValue(new Error('請求明細更新エラー'));

    const input = {
      invoiceId: 'INV-20240115-001',
      modifiedLineItems: [
        {
          lineItemId: 'LINE-001',
          quantity: 5,
          unitPrice: 1000,
          taxRate: 0.1,
        },
      ],
      modificationReason: '顧客からの数量訂正依頼',
      currentDateTime: new Date('2024-01-15T10:30:00Z'),
      executingUserId: 'USER-sales-001',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvoiceLineItemUpdateFailed);
    expect(mockFetchInvoiceById).toHaveBeenCalledWith('INV-20240115-001');
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith('INV-20240115-001');
    expect(mockRecordModificationWithHistory).toHaveBeenCalled();
    expect(mockSaveInvoice).toHaveBeenCalled();
  });
});
