import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-804: 結果を更新日時昇順でソートできる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch invoices sorted by updatedAt in ascending order', async () => {
    const mockInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'sales-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-05T10:00:00Z',
        dueDate: '2024-02-05T23:59:59Z',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        untaxedAmount: 900000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: null,
        remarks: '月次請求',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-10T14:30:00Z',
        createdBy: 'system',
      },
      {
        invoiceId: 'inv-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'sales-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-15T10:00:00Z',
        dueDate: '2024-02-15T23:59:59Z',
        invoiceAmount: 2000000,
        taxAmount: 200000,
        untaxedAmount: 1800000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: null,
        remarks: '月次請求',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-20T09:15:00Z',
        createdBy: 'system',
      },
      {
        invoiceId: 'inv-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'sales-001',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-10T10:00:00Z',
        dueDate: '2024-02-10T23:59:59Z',
        invoiceAmount: 1500000,
        taxAmount: 150000,
        untaxedAmount: 1350000,
        invoiceStatus: 'paid',
        paidDate: '2024-01-25T10:00:00Z',
        paidAmount: 1500000,
        remarks: '月次請求',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-10T07:00:00Z',
        updatedAt: '2024-01-25T15:45:00Z',
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
      sortBy: 'updatedAt',
    });

    expect(result.invoices).toHaveLength(3);
    expect(result.invoices[0].updatedAt).toBe('2024-01-10T14:30:00Z');
    expect(result.invoices[0].invoiceNumber).toBe('INV-2024-001');
    expect(result.invoices[1].updatedAt).toBe('2024-01-20T09:15:00Z');
    expect(result.invoices[1].invoiceNumber).toBe('INV-2024-002');
    expect(result.invoices[2].updatedAt).toBe('2024-01-25T15:45:00Z');
    expect(result.invoices[2].invoiceNumber).toBe('INV-2024-003');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
