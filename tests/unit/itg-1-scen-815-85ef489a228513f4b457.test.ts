import { fetchInvoiceLineItemsByInvoice } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-815: 請求明細が1件だけ存在する場合、その1件が取得される', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';
  const lineItem = {
    lineItemId: '660e8400-e29b-41d4-a716-446655440001',
    invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    dealId: '770e8400-e29b-41d4-a716-446655440002',
    activityId: '880e8400-e29b-41d4-a716-446655440003',
    lineNumber: 1,
    productName: 'クラウドサービス利用料',
    productDescription: '月次クラウドサービス利用料（2026年1月分）',
    quantity: 1,
    unitPrice: 100000,
    amount: 100000,
    taxRate: 10,
    taxAmount: 10000,
    taxIncludedAmount: 110000,
    remarks: 'クラウドサービス',
    modificationPreviousQuantity: null,
    modificationPreviousUnitPrice: null,
    modificationPreviousAmount: null,
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-01-15T09:30:00Z',
    createdBy: '営業太郎',
  };
  const invoiceData = {
    invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    dealId: '770e8400-e29b-41d4-a716-446655440001',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-01-15',
    dueDate: '2026-02-15',
    invoiceAmount: 110000,
    taxAmount: 10000,
    untaxedAmount: 100000,
    invoiceStatus: 'issued',
    paidDate: null,
    paidAmount: null,
    remarks: null,
    modificationReason: null,
    reissueCount: 0,
    lastReissuedAt: null,
    amountCalculationVerificationStatus: 'verified',
    referenceIntegrityVerificationStatus: 'verified',
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-01-15T09:30:00Z',
    createdBy: '営業太郎',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return single line item when only one line item exists', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === 'invoices') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'invoiceLineItems') {
        return Promise.resolve([lineItem]);
      }
      return Promise.resolve([]);
    });

    const result = await fetchInvoiceLineItemsByInvoice({ invoiceId });

    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].lineItemId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.lineItems[0].invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.lineItems[0].dealId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.lineItems[0].activityId).toBe('880e8400-e29b-41d4-a716-446655440003');
    expect(result.lineItems[0].lineNumber).toBe(1);
    expect(result.lineItems[0].productName).toBe('クラウドサービス利用料');
    expect(result.lineItems[0].productDescription).toBe('月次クラウドサービス利用料（2026年1月分）');
    expect(result.lineItems[0].quantity).toBe(1);
    expect(result.lineItems[0].unitPrice).toBe(100000);
    expect(result.lineItems[0].amount).toBe(100000);
    expect(result.lineItems[0].taxRate).toBe(10);
    expect(result.lineItems[0].taxAmount).toBe(10000);
    expect(result.lineItems[0].taxIncludedAmount).toBe(110000);
    expect(result.lineItems[0].remarks).toBe('クラウドサービス');
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
