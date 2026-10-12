import { modifyInvoice, InvoiceUpdateFailed } from '../../src/logic/invoice-generation-management';
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

describe('SCEN-132: 請求書レコードの更新処理が失敗した場合、InvoiceUpdateFailedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceUpdateFailed when saveInvoice fails', async () => {
    const mockFetchInvoiceById = jest.spyOn(dataPersistence, 'fetchInvoiceById').mockResolvedValue({
      invoiceId: 'INV-2025-001',
      invoiceNumber: '2025-00001',
      invoiceStatus: 'Draft',
      invoiceAmount: 10000,
      taxAmount: 1000,
      untaxedAmount: 9000,
    } as any);

    const mockFetchInvoiceWithLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems').mockResolvedValue([
      {
        lineItemId: 'LINE-001',
        invoiceId: 'INV-2025-001',
        quantity: 10,
        unitPrice: 1000,
        taxRate: 0.1,
        lineItemAmount: 10000,
      },
    ] as any);

    const mockRecordModificationWithHistory = jest.spyOn(modificationTracking, 'recordModificationWithHistory')
      .mockResolvedValue({ modificationRecordId: 'MOD-001' } as any);

    const mockSaveInvoice = jest.spyOn(dataPersistence, 'saveInvoice')
      .mockRejectedValue(new Error('請求書更新エラー'));

    const input = {
      invoiceId: 'INV-2025-001',
      modifiedLineItems: [
        {
          lineItemId: 'LINE-001',
          quantity: 5,
          unitPrice: 1000,
          taxRate: 0.1,
        },
      ],
      modificationReason: '顧客からの数量変更申請に対応',
      currentDateTime: new Date('2025-01-15T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(InvoiceUpdateFailed);
    expect(mockFetchInvoiceById).toHaveBeenCalledWith('INV-2025-001');
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith('INV-2025-001');
    expect(mockRecordModificationWithHistory).toHaveBeenCalled();
  });
});
