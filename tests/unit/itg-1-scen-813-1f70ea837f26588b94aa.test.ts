import { fetchInvoiceLineItemsByInvoice, NoLineItemsFound } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-813: 請求書に紐付く請求明細が存在しない場合、NoLineItemsFoundエラーが発生', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
  const invoiceData = {
    invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    dealId: '770e8400-e29b-41d4-a716-446655440001',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-01-15',
    dueDate: '2026-02-15',
    invoiceAmount: 0,
    taxAmount: 0,
    untaxedAmount: 0,
    invoiceStatus: 'issued',
    paidDate: null,
    paidAmount: null,
    remarks: null,
    modificationReason: null,
    reissueCount: 0,
    lastReissuedAt: null,
    amountCalculationVerificationStatus: 'verified',
    referenceIntegrityVerificationStatus: 'verified',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
    createdBy: 'user1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoLineItemsFound error when no line items exist for the invoice', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === 'invoices') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'invoiceLineItems') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(fetchInvoiceLineItemsByInvoice({ invoiceId })).rejects.toThrow(NoLineItemsFound);
    await expect(fetchInvoiceLineItemsByInvoice({ invoiceId })).rejects.toThrow('この請求書に紐付く請求明細がありません。');
  });
});
