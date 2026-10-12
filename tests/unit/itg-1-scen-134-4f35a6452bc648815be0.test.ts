import { modifyInvoice } from '../../src/logic/invoice-generation-management';
import type { ModifyInvoiceOutput } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));
jest.mock('../../src/logic/modification-tracking', () => ({
  ...jest.requireActual<typeof import('../../src/logic/modification-tracking')>('../../src/logic/modification-tracking'),
}));
jest.mock('../../src/logic/audit-logging', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-logging')>('../../src/logic/audit-logging'),
}));

describe('SCEN-134: 修正対象の請求明細を指定しない場合、修正理由のみで修正履歴が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record modification history with only modificationReason when modifiedLineItems is null', async () => {
    const mockFetchInvoiceById = jest.spyOn(dataPersistence, 'fetchInvoiceById').mockResolvedValue({
      invoiceId: 'INV-20250107-001',
      invoiceNumber: 'SLS-2025-001',
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
        amount: 50000,
      },
      {
        lineItemId: 'LINE-002',
        quantity: 10,
        unitPrice: 5000,
        taxRate: 0.1,
        amount: 50000,
      },
    ] as any);

    const mockRecordModificationWithHistory = jest.spyOn(modificationTracking, 'recordModificationWithHistory')
      .mockResolvedValue({ modificationRecordId: 'MOD-HISTORY-001' } as any);

    const mockSaveInvoice = jest.spyOn(dataPersistence, 'saveInvoice')
      .mockResolvedValue({ invoiceId: 'INV-20250107-001' } as any);

    const mockRecordUserOperation = jest.spyOn(auditLogging, 'recordUserOperation')
      .mockResolvedValue({ operationId: 'OP-001' } as any);

    const input = {
      invoiceId: 'INV-20250107-001',
      modifiedLineItems: null as any,
      modificationReason: '顧客からの請求内容確認に基づく修正',
      currentDateTime: new Date('2025-01-07T10:30:00Z'),
      executingUserId: 'USER-12345',
    };

    const result = await modifyInvoice(input);

    expect(result).toBeDefined();
    expect(result.invoiceId).toBe('INV-20250107-001');
    expect(result.invoiceNumber).toBe('SLS-2025-001');
    expect(result.invoiceAmount).toBe(110000);
    expect(result.taxAmount).toBe(10000);
    expect(result.untaxedAmount).toBe(100000);
    expect(result.modifiedLineItemIds).toEqual([]);
    expect(result.invoiceStatus).toBe('draft');
    expect(result.modificationRecordId).toBe('MOD-HISTORY-001');
    expect(result.modifiedAt).toEqual(new Date('2025-01-07T10:30:00Z'));

    expect(mockFetchInvoiceById).toHaveBeenCalledWith('INV-20250107-001');
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith('INV-20250107-001');
    expect(mockRecordModificationWithHistory).toHaveBeenCalled();
    expect(mockSaveInvoice).toHaveBeenCalled();
    expect(mockRecordUserOperation).toHaveBeenCalled();
  });
});
