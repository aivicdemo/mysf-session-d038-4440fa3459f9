import { fetchInvoicesForPeriod, type FetchInvoicesForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-806: 結果を支払期限日昇順でソートできる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort invoices by due date in ascending order', async () => {
    const mockInvoices = [
      {
        id: 'inv-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'sales-rep-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-10T09:00:00Z',
        dueDate: '2024-02-10T00:00:00Z',
        invoiceAmount: 500000,
        taxAmount: 50000,
        untaxedAmount: 450000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '営業商品A',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-10T09:30:00Z',
        updatedAt: '2024-01-10T09:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'inv-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'sales-rep-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-15T10:00:00Z',
        dueDate: '2024-02-05T00:00:00Z',
        invoiceAmount: 300000,
        taxAmount: 30000,
        untaxedAmount: 270000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '営業商品B',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-15T10:15:00Z',
        updatedAt: '2024-01-15T10:15:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'inv-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'sales-rep-001',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-20T14:00:00Z',
        dueDate: '2024-02-20T00:00:00Z',
        invoiceAmount: 750000,
        taxAmount: 75000,
        untaxedAmount: 675000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '営業商品C',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-20T14:30:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        createdBy: 'user-001',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockInvoices);

    const result: FetchInvoicesForPeriodOutput = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'dueDate',
    });

    expect(result.totalCount).toBe(3);
    expect(result.invoices).toHaveLength(3);
    expect(result.invoices[0].dueDate).toBe('2024-02-05T00:00:00Z');
    expect(result.invoices[0].invoiceNumber).toBe('INV-2024-002');
    expect(result.invoices[1].dueDate).toBe('2024-02-10T00:00:00Z');
    expect(result.invoices[1].invoiceNumber).toBe('INV-2024-001');
    expect(result.invoices[2].dueDate).toBe('2024-02-20T00:00:00Z');
    expect(result.invoices[2].invoiceNumber).toBe('INV-2024-003');
    expect(result.fetchedAt).toBeDefined();
  });
});
