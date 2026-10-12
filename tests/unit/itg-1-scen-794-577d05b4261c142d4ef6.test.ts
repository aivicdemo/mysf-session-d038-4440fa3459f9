import { fetchInvoicesForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-794: fetchInvoicesForPeriod returns invoices within specified period', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoices created or updated within specified period sorted by updatedAt', async () => {
    const testInvoices = [
      {
        id: 'inv-001',
        invoiceId: 'uuid-inv-001',
        dealId: 'uuid-opp-001',
        customerId: 'uuid-cust-001',
        salesRepresentativeId: 'uuid-sr-001',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-01-05T09:00:00Z',
        dueDate: '2024-02-05T23:59:59Z',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        untaxedAmount: 900000,
        invoiceStatus: '未入金',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品A納品分',
        createdAt: '2024-01-05T08:30:00Z',
        updatedAt: '2024-01-05T08:30:00Z',
        createdBy: 'user-sr-001',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: '正常',
        referenceIntegrityVerificationStatus: '正常',
      },
      {
        id: 'inv-002',
        invoiceId: 'uuid-inv-002',
        dealId: 'uuid-opp-002',
        customerId: 'uuid-cust-002',
        salesRepresentativeId: 'uuid-sr-002',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: '2024-01-10T10:00:00Z',
        dueDate: '2024-02-10T23:59:59Z',
        invoiceAmount: 2500000,
        taxAmount: 250000,
        untaxedAmount: 2250000,
        invoiceStatus: '入金済',
        paidDate: '2024-01-15T14:00:00Z',
        paidAmount: 2500000,
        remarks: '商品B納品分',
        createdAt: '2024-01-10T09:45:00Z',
        updatedAt: '2024-01-15T14:05:00Z',
        createdBy: 'user-sr-002',
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: '正常',
        referenceIntegrityVerificationStatus: '正常',
      },
      {
        id: 'inv-003',
        invoiceId: 'uuid-inv-003',
        dealId: 'uuid-opp-003',
        customerId: 'uuid-cust-001',
        salesRepresentativeId: 'uuid-sr-001',
        invoiceNumber: 'INV-2024-003',
        invoiceDate: '2024-01-20T11:00:00Z',
        dueDate: '2024-02-20T23:59:59Z',
        invoiceAmount: 1500000,
        taxAmount: 150000,
        untaxedAmount: 1350000,
        invoiceStatus: '未入金',
        paidDate: null,
        paidAmount: 0,
        remarks: '商品C納品分',
        createdAt: '2024-01-20T10:30:00Z',
        updatedAt: '2024-01-25T13:20:00Z',
        createdBy: 'user-sr-001',
        modificationReason: '金額調整',
        reissueCount: 1,
        lastReissuedAt: '2024-01-25T13:20:00Z',
        amountCalculationVerificationStatus: '正常',
        referenceIntegrityVerificationStatus: '正常',
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

    // Verify sorting by updatedAt ascending
    expect(result.invoices[0].invoiceId).toBe('uuid-inv-001');
    expect(result.invoices[1].invoiceId).toBe('uuid-inv-003');
    expect(result.invoices[2].invoiceId).toBe('uuid-inv-002');
  });
});
