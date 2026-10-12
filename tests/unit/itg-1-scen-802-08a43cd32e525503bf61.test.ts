import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-802: 請求ステータスフィルターを指定せず全ステータスの請求書を取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch invoices for period without status filter and return results sorted by updatedAt', async () => {
    const mockInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: 'opp-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-10T10:00:00Z',
        dueDate: '2024-02-10T23:59:59Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        untaxedAmount: 90000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品代金',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-05T08:30:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'user-001',
      },
      {
        invoiceId: 'inv-002',
        dealId: 'opp-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-15T14:30:00Z',
        dueDate: '2024-02-15T23:59:59Z',
        invoiceAmount: 250000,
        taxAmount: 25000,
        untaxedAmount: 225000,
        invoiceStatus: 'paid',
        paidDate: '2024-01-20T09:00:00Z',
        paidAmount: 250000,
        remarks: 'サービス代金',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-12T09:15:00Z',
        updatedAt: '2024-01-20T09:00:00Z',
        createdBy: 'user-002',
      },
      {
        invoiceId: 'inv-003',
        dealId: 'opp-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-20T11:00:00Z',
        dueDate: '2024-02-20T23:59:59Z',
        invoiceAmount: 150000,
        taxAmount: 15000,
        untaxedAmount: 135000,
        invoiceStatus: 'overdue',
        paidDate: null,
        paidAmount: 0,
        remarks: '追加商品',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'valid',
        referenceIntegrityVerificationStatus: 'valid',
        createdAt: '2024-01-18T13:45:00Z',
        updatedAt: '2024-01-20T11:00:00Z',
        createdBy: 'user-001',
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
    expect(result.invoices[0].invoiceNumber).toBe('INV-2024-001');
    expect(result.invoices[0].invoiceStatus).toBe('issued');
    expect(result.invoices[0].updatedAt).toBe('2024-01-10T10:00:00Z');
    expect(result.invoices[1].invoiceNumber).toBe('INV-2024-002');
    expect(result.invoices[1].invoiceStatus).toBe('paid');
    expect(result.invoices[1].updatedAt).toBe('2024-01-20T09:00:00Z');
    expect(result.invoices[2].invoiceNumber).toBe('INV-2024-003');
    expect(result.invoices[2].invoiceStatus).toBe('overdue');
    expect(result.invoices[2].updatedAt).toBe('2024-01-20T11:00:00Z');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
