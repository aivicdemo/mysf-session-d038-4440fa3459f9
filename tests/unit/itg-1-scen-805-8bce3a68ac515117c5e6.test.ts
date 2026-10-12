import { fetchInvoicesForPeriod, type FetchInvoicesForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-805: 結果を請求金額昇順でソートできる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort invoices by invoice amount in ascending order', async () => {
    const mockInvoices = [
      {
        id: 'inv-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'sales-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15T09:00:00Z',
        dueDate: '2024-02-15T23:59:59Z',
        invoiceAmount: 150000,
        taxAmount: 15000,
        untaxedAmount: 135000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品A販売',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-10T08:30:00Z',
        updatedAt: '2024-01-10T08:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'inv-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'sales-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-20T10:00:00Z',
        dueDate: '2024-02-20T23:59:59Z',
        invoiceAmount: 50000,
        taxAmount: 5000,
        untaxedAmount: 45000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品B販売',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-18T11:00:00Z',
        updatedAt: '2024-01-18T11:00:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'inv-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'sales-003',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-25T14:00:00Z',
        dueDate: '2024-02-25T23:59:59Z',
        invoiceAmount: 300000,
        taxAmount: 30000,
        untaxedAmount: 270000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品C販売',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-22T15:30:00Z',
        updatedAt: '2024-01-22T15:30:00Z',
        createdBy: 'user-003',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockInvoices);

    const result: FetchInvoicesForPeriodOutput = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'invoiceAmount',
    });

    expect(result.totalCount).toBe(3);
    expect(result.invoices).toHaveLength(3);
    expect(result.invoices[0].invoiceAmount).toBe(50000);
    expect(result.invoices[0].invoiceNumber).toBe('INV-2024-002');
    expect(result.invoices[1].invoiceAmount).toBe(150000);
    expect(result.invoices[1].invoiceNumber).toBe('INV-2024-001');
    expect(result.invoices[2].invoiceAmount).toBe(300000);
    expect(result.invoices[2].invoiceNumber).toBe('INV-2024-003');
    expect(result.fetchedAt).toBeDefined();
  });
});
