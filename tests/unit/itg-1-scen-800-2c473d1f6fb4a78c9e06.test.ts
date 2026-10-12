import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-800: fetchInvoicesForPeriod without sales representative filter returns all invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoices from all sales representatives when filter is not specified', async () => {
    const testInvoices = [
      {
        id: 'inv-001',
        invoiceId: 'uuid-invoice-001',
        dealId: 'uuid-deal-001',
        customerId: 'uuid-customer-001',
        salesRepresentativeId: 'uuid-rep-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15T09:00:00Z',
        dueDate: '2024-02-15T23:59:59Z',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        untaxedAmount: 900000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品A納品分',
        createdAt: '2024-01-10T08:30:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        createdBy: 'rep-001',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'valid',
      },
      {
        id: 'inv-002',
        invoiceId: 'uuid-invoice-002',
        dealId: 'uuid-deal-002',
        customerId: 'uuid-customer-002',
        salesRepresentativeId: 'uuid-rep-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-20T10:00:00Z',
        dueDate: '2024-02-20T23:59:59Z',
        invoiceAmount: 2500000,
        taxAmount: 250000,
        untaxedAmount: 2250000,
        invoiceStatus: 'paid',
        paidDate: '2024-01-28T15:30:00Z',
        paidAmount: 2500000,
        remarks: '商品B・C納品分',
        createdAt: '2024-01-18T07:45:00Z',
        updatedAt: '2024-01-28T15:30:00Z',
        createdBy: 'rep-002',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'valid',
      },
      {
        id: 'inv-003',
        invoiceId: 'uuid-invoice-003',
        dealId: 'uuid-deal-003',
        customerId: 'uuid-customer-003',
        salesRepresentativeId: 'uuid-rep-003',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-25T11:20:00Z',
        dueDate: '2024-02-25T23:59:59Z',
        invoiceAmount: 1500000,
        taxAmount: 150000,
        untaxedAmount: 1350000,
        invoiceStatus: 'pending',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品D試験導入分',
        createdAt: '2024-01-22T06:00:00Z',
        updatedAt: '2024-01-25T11:20:00Z',
        createdBy: 'rep-003',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'valid',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(testInvoices);

    const result = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.invoices).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();

    // Verify invoices from multiple sales representatives are included
    const repIds = result.invoices.map(inv => inv.salesRepresentativeId);
    expect(repIds).toContain('uuid-rep-001');
    expect(repIds).toContain('uuid-rep-002');
    expect(repIds).toContain('uuid-rep-003');

    // Verify sorted by updatedAt ascending
    expect(result.invoices[0].invoiceId).toBe('uuid-invoice-001');
    expect(result.invoices[1].invoiceId).toBe('uuid-invoice-003');
    expect(result.invoices[2].invoiceId).toBe('uuid-invoice-002');
  });
});
