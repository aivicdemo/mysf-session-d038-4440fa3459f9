import { jest } from '@jest/globals';
import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import type { DisplayCustomerTransactionHistoryInput } from '../../src/logic/customer-transaction-history';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<any>('../../src/logic/data-persistence'),
  fetchCustomerWithRelatedRecords: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
}));

jest.mock('../../src/logic/deal-invoice-reconciliation', () => ({
  ...jest.requireActual<any>('../../src/logic/deal-invoice-reconciliation'),
  validateInvoiceReferenceIntegrity: jest.fn(),
}));

jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<any>('../../src/logic/access-control-enforcement'),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

const mockDataPersistence = jest.requireMock('../../src/logic/data-persistence') as any;
const mockDealInvoiceReconciliation = jest.requireMock('../../src/logic/deal-invoice-reconciliation') as any;
const mockAccessControl = jest.requireMock('../../src/logic/access-control-enforcement') as any;

describe('SCEN-497: キャンセル・返金・修正請求のステータスを持つ請求レコードが存在する場合、specialInvoiceStatusesに該当レコードが格納される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include cancelled, refunded, and revised invoices in specialInvoiceStatuses', async () => {
    const customerId = 'cust-uuid-12345';
    const loginUserId = 'user-uuid-67890';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

    const dealRecords = [
      {
        dealId: 'deal-001',
        dealName: 'Project Alpha',
        dealAmount: 500000,
        stageId: 'stage-won',
        expectedContractDate: '2026-06-01T09:00:00Z',
        contractedDate: '2026-07-15T14:30:00Z',
        createdAt: '2026-06-01T09:00:00Z',
        updatedAt: '2026-07-15T14:30:00Z',
        createdBy: 'user-001',
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        salesRepresentativeId: 'rep-001',
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'inv-001',
        dealId: 'deal-001',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-001',
        invoiceDate: '2026-07-20T10:00:00Z',
        dueDate: '2026-08-10T10:00:00Z',
        invoiceAmount: 500000,
        taxAmount: 50000,
        untaxedAmount: 450000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-07-20T10:00:00Z',
        updatedAt: '2026-07-20T10:00:00Z',
        createdBy: 'user-001',
      },
      {
        invoiceId: 'inv-002',
        dealId: 'deal-001',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-002',
        invoiceDate: '2026-08-10T11:00:00Z',
        dueDate: '2026-09-10T11:00:00Z',
        invoiceAmount: 50000,
        taxAmount: 5000,
        untaxedAmount: 45000,
        invoiceStatus: 'cancelled',
        paidDate: null,
        paidAmount: null,
        remarks: 'Cancelled',
        modificationReason: 'Duplicate invoice',
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-08-10T11:00:00Z',
        updatedAt: '2026-08-10T11:00:00Z',
        createdBy: 'user-001',
      },
      {
        invoiceId: 'inv-003',
        dealId: 'deal-001',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-003',
        invoiceDate: '2026-08-15T12:00:00Z',
        dueDate: '2026-09-15T12:00:00Z',
        invoiceAmount: 30000,
        taxAmount: 3000,
        untaxedAmount: 27000,
        invoiceStatus: 'refunded',
        paidDate: '2026-08-25T00:00:00Z',
        paidAmount: 30000,
        remarks: 'Refunded',
        modificationReason: 'Refund issued',
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-08-15T12:00:00Z',
        updatedAt: '2026-08-15T12:00:00Z',
        createdBy: 'user-001',
      },
      {
        invoiceId: 'inv-004',
        dealId: 'deal-001',
        customerId,
        salesRepresentativeId: 'rep-001',
        invoiceNumber: 'INV-004',
        invoiceDate: '2026-08-20T13:00:00Z',
        dueDate: '2026-09-20T13:00:00Z',
        invoiceAmount: 520000,
        taxAmount: 52000,
        untaxedAmount: 468000,
        invoiceStatus: 'revised',
        paidDate: null,
        paidAmount: null,
        remarks: 'Revised invoice',
        modificationReason: 'Corrected amount',
        reissueCount: 1,
        lastReissuedAt: '2026-08-20T13:00:00Z',
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-08-20T13:00:00Z',
        updatedAt: '2026-08-20T13:00:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataPersistence.fetchCustomerWithRelatedRecords.mockResolvedValue({
      customer: {
        customerId,
        customerName: '顧客A',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2026-06-01T09:00:00Z',
        updatedAt: '2026-06-01T09:00:00Z',
        createdBy: 'user-001',
        updatedBy: 'user-001',
      },
      deals: dealRecords,
      activities: [],
      invoices: invoiceRecords.map(inv => ({
        invoice: inv,
        lineItems: [],
      })),
      fetchedAt: new Date().toISOString(),
    });

    mockDataPersistence.fetchInvoicesForPeriod.mockResolvedValue({
      invoices: invoiceRecords,
      totalCount: 4,
      fetchedAt: new Date().toISOString(),
    });

    mockDealInvoiceReconciliation.validateInvoiceReferenceIntegrity.mockResolvedValue({
      dealId: 'deal-001',
      isValid: true,
      invoiceIds: ['inv-001', 'inv-002', 'inv-003', 'inv-004'],
      referenceAnomalies: [],
      validationTimestamp: currentDateTime,
    });

    mockAccessControl.enforceAccessControlForDataDisplay.mockResolvedValue({
      accessGranted: true,
      userId: loginUserId,
      customerId,
    });

    const input: DisplayCustomerTransactionHistoryInput = {
      customerId,
      loginUserId,
      currentDateTime,
    };

    const output = await displayCustomerTransactionHistory(input);

    expect(output).toBeDefined();
    expect(output.customerId).toBe(customerId);
    expect(output.customerName).toBe('顧客A');

    expect(output.specialInvoiceStatuses).toBeDefined();
    expect(output.specialInvoiceStatuses.length).toBe(3);

    const cancelledInvoice = output.specialInvoiceStatuses.find(
      (si) => si.invoiceId === 'inv-002'
    );
    expect(cancelledInvoice).toBeDefined();
    expect(cancelledInvoice?.status).toBe('cancelled');
    expect(cancelledInvoice?.displayGroup).toBe('cancelled');
    expect(cancelledInvoice?.visualIndicator).toBe('red_strikethrough');
    expect(cancelledInvoice?.amount).toBe(50000);

    const refundedInvoice = output.specialInvoiceStatuses.find(
      (si) => si.invoiceId === 'inv-003'
    );
    expect(refundedInvoice).toBeDefined();
    expect(refundedInvoice?.status).toBe('refunded');
    expect(refundedInvoice?.displayGroup).toBe('refunded');
    expect(refundedInvoice?.visualIndicator).toBe('blue_badge');
    expect(refundedInvoice?.amount).toBe(30000);

    const revisedInvoice = output.specialInvoiceStatuses.find(
      (si) => si.invoiceId === 'inv-004'
    );
    expect(revisedInvoice).toBeDefined();
    expect(revisedInvoice?.status).toBe('revised');
    expect(revisedInvoice?.displayGroup).toBe('revised');
    expect(revisedInvoice?.visualIndicator).toBe('orange_marker');
    expect(revisedInvoice?.amount).toBe(520000);

    expect(output.transactionHistory).toBeDefined();
    expect(output.inconsistencies).toBeDefined();
    expect(output.inconsistencies.length).toBe(0);
    expect(output.notificationContent).toBeNull();
  });
});
