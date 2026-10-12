import { fetchInvoiceLineItemsByInvoice } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-811: 複数件の請求明細が行番号順に取得される', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
  const lineItems = [
    {
      lineItemId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '770e8400-e29b-41d4-a716-446655440001',
      activityId: '880e8400-e29b-41d4-a716-446655440001',
      lineNumber: 1,
      productName: 'プロダクト A',
      productDescription: '説明A',
      quantity: 5,
      unitPrice: 10000,
      amount: 50000,
      taxRate: 10,
      taxAmount: 5000,
      taxIncludedAmount: 55000,
      remarks: '備考A',
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      createdBy: 'user1',
    },
    {
      lineItemId: '660e8400-e29b-41d4-a716-446655440002',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      activityId: '880e8400-e29b-41d4-a716-446655440002',
      lineNumber: 2,
      productName: 'プロダクト B',
      productDescription: '説明B',
      quantity: 3,
      unitPrice: 20000,
      amount: 60000,
      taxRate: 10,
      taxAmount: 6000,
      taxIncludedAmount: 66000,
      remarks: '備考B',
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      createdBy: 'user1',
    },
    {
      lineItemId: '660e8400-e29b-41d4-a716-446655440003',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '770e8400-e29b-41d4-a716-446655440003',
      activityId: '880e8400-e29b-41d4-a716-446655440003',
      lineNumber: 3,
      productName: 'プロダクト C',
      productDescription: '説明C',
      quantity: 2,
      unitPrice: 15000,
      amount: 30000,
      taxRate: 10,
      taxAmount: 3000,
      taxIncludedAmount: 33000,
      remarks: '備考C',
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      createdAt: '2026-01-15T11:00:00Z',
      updatedAt: '2026-01-15T11:00:00Z',
      createdBy: 'user1',
    },
  ];
  const invoiceData = {
    invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    dealId: '770e8400-e29b-41d4-a716-446655440001',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-01-15',
    dueDate: '2026-02-15',
    invoiceAmount: 141000,
    taxAmount: 11000,
    untaxedAmount: 130000,
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

  it('should return invoice line items sorted by line number in ascending order', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === 'invoices') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'invoiceLineItems') {
        return Promise.resolve(lineItems);
      }
      return Promise.resolve([]);
    });

    const result = await fetchInvoiceLineItemsByInvoice({ invoiceId });

    expect(result.lineItems).toHaveLength(3);
    expect(result.lineItems[0].lineNumber).toBe(1);
    expect(result.lineItems[0].productName).toBe('プロダクト A');
    expect(result.lineItems[0].amount).toBe(50000);
    expect(result.lineItems[1].lineNumber).toBe(2);
    expect(result.lineItems[1].productName).toBe('プロダクト B');
    expect(result.lineItems[1].amount).toBe(60000);
    expect(result.lineItems[2].lineNumber).toBe(3);
    expect(result.lineItems[2].productName).toBe('プロダクト C');
    expect(result.lineItems[2].amount).toBe(30000);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
