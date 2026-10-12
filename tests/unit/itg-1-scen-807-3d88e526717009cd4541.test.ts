import { fetchInvoicesForPeriod, type FetchInvoicesForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-807: ソート順序を指定せず既定値の更新日時昇順で取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort invoices by updated date in ascending order when sort order is not specified', async () => {
    const mockInvoices = [
      {
        id: 'invoice-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-05T10:00:00Z',
        dueDate: '2024-02-05T10:00:00Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        untaxedAmount: 90000,
        invoiceStatus: '未入金',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品A販売',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: '検証済み',
        referenceIntegrityVerificationStatus: '検証済み',
        createdAt: '2024-01-05T09:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        createdBy: 'admin',
      },
      {
        id: 'invoice-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-10T10:00:00Z',
        dueDate: '2024-02-10T10:00:00Z',
        invoiceAmount: 250000,
        taxAmount: 25000,
        untaxedAmount: 225000,
        invoiceStatus: '入金済み',
        paidDate: '2024-01-20T16:45:00Z',
        paidAmount: 250000,
        remarks: '商品B販売',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: '検証済み',
        referenceIntegrityVerificationStatus: '検証済み',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-12T11:30:00Z',
        createdBy: 'admin',
      },
      {
        id: 'invoice-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-20T10:00:00Z',
        dueDate: '2024-02-20T10:00:00Z',
        invoiceAmount: 150000,
        taxAmount: 15000,
        untaxedAmount: 135000,
        invoiceStatus: '未入金',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品C販売',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: '検証済み',
        referenceIntegrityVerificationStatus: '検証済み',
        createdAt: '2024-01-20T08:15:00Z',
        updatedAt: '2024-01-25T13:45:00Z',
        createdBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockInvoices);

    const result: FetchInvoicesForPeriodOutput = await fetchInvoicesForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      invoiceStatusFilter: null,
      sortBy: null,
    });

    expect(result.totalCount).toBe(3);
    expect(result.invoices).toHaveLength(3);
    expect(result.invoices[0].updatedAt).toBe('2024-01-12T11:30:00Z');
    expect(result.invoices[0].invoiceNumber).toBe('INV-2024-002');
    expect(result.invoices[1].updatedAt).toBe('2024-01-15T14:20:00Z');
    expect(result.invoices[1].invoiceNumber).toBe('INV-2024-001');
    expect(result.invoices[2].updatedAt).toBe('2024-01-25T13:45:00Z');
    expect(result.invoices[2].invoiceNumber).toBe('INV-2024-003');
    expect(result.fetchedAt).toBeDefined();
  });
});
