import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-803: 結果を作成日時昇順でソートできる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch invoices sorted by createdAt in ascending order', async () => {
    const mockInvoices = [
      {
        invoiceId: 'invoice-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-15T09:00:00Z',
        dueDate: '2024-02-14T23:59:59Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        untaxedAmount: 90000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: 'Product A sales',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'passed',
        referenceIntegrityVerificationStatus: 'passed',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z',
        createdBy: 'system',
      },
      {
        invoiceId: 'invoice-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'sales-rep-001',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-20T10:30:00Z',
        dueDate: '2024-02-19T23:59:59Z',
        invoiceAmount: 250000,
        taxAmount: 25000,
        untaxedAmount: 225000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: 'Product B sales',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'passed',
        referenceIntegrityVerificationStatus: 'passed',
        createdAt: '2024-01-15T07:30:00Z',
        updatedAt: '2024-01-15T07:30:00Z',
        createdBy: 'system',
      },
      {
        invoiceId: 'invoice-003',
        dealId: 'deal-003',
        customerId: 'customer-003',
        salesRepresentativeId: 'sales-rep-002',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-25T14:00:00Z',
        dueDate: '2024-02-24T23:59:59Z',
        invoiceAmount: 150000,
        taxAmount: 15000,
        untaxedAmount: 135000,
        invoiceStatus: 'paid',
        paidDate: '2024-01-28T16:00:00Z',
        paidAmount: 150000,
        remarks: 'Product C sales',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'passed',
        referenceIntegrityVerificationStatus: 'passed',
        createdAt: '2024-01-20T11:15:00Z',
        updatedAt: '2024-01-28T16:05:00Z',
        createdBy: 'system',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockInvoices);

    const result = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: 'createdAt',
    });

    expect(result.invoices).toHaveLength(3);
    expect(result.invoices[0].createdAt).toBe('2024-01-10T08:00:00Z');
    expect(result.invoices[0].invoiceNumber).toBe('INV-2024-001');
    expect(result.invoices[1].createdAt).toBe('2024-01-15T07:30:00Z');
    expect(result.invoices[1].invoiceNumber).toBe('INV-2024-002');
    expect(result.invoices[2].createdAt).toBe('2024-01-20T11:15:00Z');
    expect(result.invoices[2].invoiceNumber).toBe('INV-2024-003');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
