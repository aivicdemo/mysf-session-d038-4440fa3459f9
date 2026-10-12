import { modifyInvoice, ModificationHistoryRecordingFailed } from '../../src/logic/invoice-generation-management';
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

describe('SCEN-131: 修正履歴の記録処理が失敗した場合、ModificationHistoryRecordingFailedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ModificationHistoryRecordingFailed when recordModificationWithHistory fails', async () => {
    const mockFetchInvoiceById = jest.spyOn(dataPersistence, 'fetchInvoiceById').mockResolvedValue({
      invoiceId: 'INV-20250107-001',
      invoiceNumber: '2025-0001',
      invoiceStatus: 'draft',
      invoiceAmount: 550000,
      taxAmount: 50000,
      untaxedAmount: 500000,
      createdAt: '2025-01-06T10:00:00Z',
    } as any);

    const mockFetchInvoiceWithLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems').mockResolvedValue([
      {
        lineItemId: 'LINE-001',
        invoiceId: 'INV-20250107-001',
        quantity: 8,
        unitPrice: 5000,
        taxRate: 0.1,
        lineItemAmount: 40000,
        createdAt: '2025-01-06T10:00:00Z',
      },
    ] as any);

    const mockRecordModificationWithHistory = jest.spyOn(modificationTracking, 'recordModificationWithHistory')
      .mockRejectedValue(new Error('記録処理が失敗する'));

    const input = {
      invoiceId: 'INV-20250107-001',
      modifiedLineItems: [
        {
          lineItemId: 'LINE-001',
          quantity: 10,
          unitPrice: 5000,
          taxRate: 0.1,
        },
      ],
      modificationReason: '顧客からの数量変更依頼',
      currentDateTime: new Date('2025-01-07T14:30:00Z'),
      executingUserId: 'USER-PERSISTENCE-ERROR',
    };

    await expect(modifyInvoice(input)).rejects.toThrow(ModificationHistoryRecordingFailed);
    expect(mockFetchInvoiceById).toHaveBeenCalledWith('INV-20250107-001');
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith('INV-20250107-001');
  });
});
