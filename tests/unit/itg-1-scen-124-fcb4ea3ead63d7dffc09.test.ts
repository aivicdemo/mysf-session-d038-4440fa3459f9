import { modifyInvoice } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-124: 既存請求書が修正可能なステータスにあり、修正対象の請求明細が有効で、修正理由が指定されている場合、修正内容を請求書と請求明細に反映し、修正履歴を記録して成功する', () => {
  it('修正内容を反映し修正履歴を記録する', async () => {
    const mockFetchInvoice = jest.spyOn(dataPersistence, 'fetchInvoiceById');
    const mockFetchLineItems = jest.spyOn(dataPersistence, 'fetchInvoiceWithLineItems');
    const mockRecordModification = jest.spyOn(modificationTracking, 'recordModificationWithHistory');
    const mockSaveInvoice = jest.spyOn(dataPersistence, 'saveInvoice');
    const mockSaveLineItem = jest.spyOn(dataPersistence, 'saveInvoiceLineItem');
    const mockRecordOperation = jest.spyOn(auditLogging, 'recordUserOperation');

    mockFetchInvoice.mockResolvedValue({
      invoiceId: 'INV-2024-001',
      invoiceNumber: '2024-001',
      invoiceStatus: 'draft',
      invoiceAmount: 55000,
      taxAmount: 5500,
      untaxedAmount: 50000,
      createdAt: '2024-12-01T09:00:00Z',
    } as any);

    mockFetchLineItems.mockResolvedValue({
      lineItemId: 'LINE-001',
      invoiceId: 'INV-2024-001',
      description: '商品A',
      quantity: 10,
      unitPrice: 5000,
      taxRate: 0.1,
      amount: 50000,
    } as any);


    mockRecordModification.mockResolvedValue({
      modificationRecordId: 'MOD-REC-2024-0001',
      invoiceId: 'INV-2024-001',
      modificationDateTime: new Date('2024-12-15T10:30:00Z'),
      modificationCount: 1,
      status: 'success',
    } as any);

    mockSaveInvoice.mockResolvedValue({
      invoiceId: 'INV-2024-001',
      invoiceNumber: '2024-001',
      invoiceStatus: 'draft',
      invoiceAmount: 82500,
      taxAmount: 7500,
      untaxedAmount: 75000,
    } as any);

    mockSaveLineItem.mockResolvedValue({
      lineItemId: 'LINE-001',
      invoiceId: 'INV-2024-001',
      quantity: 15,
      unitPrice: 5000,
      amount: 75000,
    } as any);

    mockRecordOperation.mockResolvedValue({
      success: true,
    } as any);

    const input = {
      invoiceId: 'INV-2024-001',
      modifiedLineItems: [
        { lineItemId: 'LINE-001', quantity: 15, unitPrice: 5000 },
      ],
      modificationReason: '顧客からの数量変更要求に対応',
      currentDateTime: new Date('2024-12-15T10:30:00Z'),
      executingUserId: 'USR-12345',
    };

    const result = await modifyInvoice(input);

    expect(result.invoiceId).toBe('INV-2024-001');
    expect(result.invoiceNumber).toBe('2024-001');
    expect(result.invoiceAmount).toBe(82500);
    expect(result.taxAmount).toBe(7500);
    expect(result.untaxedAmount).toBe(75000);
    expect(result.modifiedLineItemIds).toContain('LINE-001');
    expect(result.invoiceStatus).toBe('draft');
    expect(result.modificationRecordId).toBe('MOD-REC-2024-0001');
    expect(result.modifiedAt).toEqual(new Date('2024-12-15T10:30:00Z'));

    expect(mockFetchInvoice).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: 'INV-2024-001' }));
    expect(mockFetchLineItems).toHaveBeenCalled();
    expect(mockRecordModification).toHaveBeenCalled();
    expect(mockSaveInvoice).toHaveBeenCalled();
    expect(mockSaveLineItem).toHaveBeenCalled();
    expect(mockRecordOperation).toHaveBeenCalled();
  });
});
