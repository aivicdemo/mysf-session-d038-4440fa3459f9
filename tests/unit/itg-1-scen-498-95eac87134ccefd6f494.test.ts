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

describe('SCEN-498: 出力型のcustomerId・customerNameが入力の顧客IDと一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return output with customerId and customerName matching input customerId and fetched customerName', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-12345';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

    const dealRecords = [
      {
        dealId: 'deal-001',
        dealName: '契約A',
        dealAmount: 100000,
        stageId: 'stage-won',
        expectedContractDate: '2026-09-01T09:00:00Z',
        contractedDate: '2026-09-15T14:30:00Z',
        createdAt: '2026-09-01T09:00:00Z',
        updatedAt: '2026-09-15T14:30:00Z',
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
        invoiceDate: '2026-09-10T10:00:00Z',
        dueDate: '2026-10-10T10:00:00Z',
        invoiceAmount: 100000,
        taxAmount: 10000,
        untaxedAmount: 90000,
        invoiceStatus: '発行済',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-09-10T10:00:00Z',
        updatedAt: '2026-09-10T10:00:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataPersistence.fetchCustomerWithRelatedRecords.mockResolvedValue({
      customer: {
        customerId,
        customerName: 'テスト顧客A',
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
        createdAt: '2026-09-01T09:00:00Z',
        updatedAt: '2026-09-01T09:00:00Z',
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
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockDealInvoiceReconciliation.validateInvoiceReferenceIntegrity.mockResolvedValue({
      dealId: 'deal-001',
      isValid: true,
      invoiceIds: ['inv-001'],
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
    expect(output.customerId).toBe(input.customerId);
    expect(output.customerName).toBe('テスト顧客A');

    expect(output.transactionHistory).toBeDefined();
    expect(output.inconsistencies).toBeDefined();
    expect(output.specialInvoiceStatuses).toBeDefined();
    expect(output.notificationContent).toBeNull();
  });
});
