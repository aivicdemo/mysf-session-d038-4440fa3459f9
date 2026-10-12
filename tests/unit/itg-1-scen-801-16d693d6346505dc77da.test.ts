import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-801: fetchInvoicesForPeriod without customer filter returns all invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoices from all customers when filter is not specified', async () => {
    const testInvoices = [
      {
        id: 'inv-001',
        invoiceId: 'uuid-inv-001',
        dealId: 'uuid-deal-001',
        customerId: 'uuid-cust-A',
        salesRepresentativeId: 'uuid-rep-X',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-05T09:00:00Z',
        dueDate: '2024-02-05T23:59:59Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        untaxedAmount: 90000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '製品A販売',
        createdAt: '2024-01-05T09:15:00Z',
        updatedAt: '2024-01-05T09:15:00Z',
        createdBy: 'rep-X',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
      },
      {
        id: 'inv-002',
        invoiceId: 'uuid-inv-002',
        dealId: 'uuid-deal-002',
        customerId: 'uuid-cust-B',
        salesRepresentativeId: 'uuid-rep-Y',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-10T10:30:00Z',
        dueDate: '2024-02-10T23:59:59Z',
        invoiceAmount: 250000,
        taxAmount: 25000,
        untaxedAmount: 225000,
        invoiceStatus: 'paid',
        paidDate: '2024-01-15T14:20:00Z',
        paidAmount: 250000,
        remarks: '製品B販売',
        createdAt: '2024-01-10T10:45:00Z',
        updatedAt: '2024-01-15T14:25:00Z',
        createdBy: 'rep-Y',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
      },
      {
        id: 'inv-003',
        invoiceId: 'uuid-inv-003',
        dealId: 'uuid-deal-003',
        customerId: 'uuid-cust-C',
        salesRepresentativeId: 'uuid-rep-Z',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-20T14:00:00Z',
        dueDate: '2024-02-20T23:59:59Z',
        invoiceAmount: 180000,
        taxAmount: 18000,
        untaxedAmount: 162000,
        invoiceStatus: 'overdue',
        paidDate: null,
        paidAmount: 0,
        remarks: 'サービス提供',
        createdAt: '2024-01-20T14:15:00Z',
        updatedAt: '2024-01-25T08:30:00Z',
        createdBy: 'rep-Z',
        modificationReason: '請求金額修正',
        reissueCount: 1,
        lastReissuedAt: '2024-01-25T08:35:00Z',
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(testInvoices);

    const result = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      customerIdFilter: null,
      salesRepresentativeIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.invoices).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();

    // Verify invoices from multiple customers are included
    const customerIds = result.invoices.map(inv => inv.customerId);
    expect(customerIds).toContain('uuid-cust-A');
    expect(customerIds).toContain('uuid-cust-B');
    expect(customerIds).toContain('uuid-cust-C');

    // Verify sorted by updatedAt ascending
    expect(result.invoices[0].invoiceId).toBe('uuid-inv-001');
    expect(result.invoices[1].invoiceId).toBe('uuid-inv-003');
    expect(result.invoices[2].invoiceId).toBe('uuid-inv-002');

    // Verify all required fields are present
    result.invoices.forEach(invoice => {
      expect(invoice).toHaveProperty('invoiceId');
      expect(invoice).toHaveProperty('dealId');
      expect(invoice).toHaveProperty('customerId');
      expect(invoice).toHaveProperty('salesRepresentativeId');
      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice).toHaveProperty('invoiceDate');
      expect(invoice).toHaveProperty('dueDate');
      expect(invoice).toHaveProperty('invoiceAmount');
      expect(invoice).toHaveProperty('taxAmount');
      expect(invoice).toHaveProperty('untaxedAmount');
      expect(invoice).toHaveProperty('invoiceStatus');
      expect(invoice).toHaveProperty('paidDate');
      expect(invoice).toHaveProperty('paidAmount');
      expect(invoice).toHaveProperty('remarks');
      expect(invoice).toHaveProperty('createdAt');
      expect(invoice).toHaveProperty('updatedAt');
      expect(invoice).toHaveProperty('createdBy');
      expect(invoice).toHaveProperty('modificationReason');
      expect(invoice).toHaveProperty('reissueCount');
      expect(invoice).toHaveProperty('lastReissuedAt');
      expect(invoice).toHaveProperty('amountCalculationVerificationStatus');
      expect(invoice).toHaveProperty('referenceIntegrityVerificationStatus');
    });
  });
});
