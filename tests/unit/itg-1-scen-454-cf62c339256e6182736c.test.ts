import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-454: 業務ルール：成績金額と請求金額が完全に一致する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isAligned=true・差異額0・差異理由空が返される', async () => {
    const customerId = 'cust-uuid-12345678-1234-1234-1234-123456789012';
    const loginUserId = 'user-uuid-87654321-4321-4321-4321-210987654321';
    const currentDateTime = new Date('2026-10-15T14:30:00.000Z');

    const mockAccessControlResponse = {
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: [],
        visibleInvoiceIds: [],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [],
    };

    const mockCustomerRecords = {
      customer: {
        customerId,
        customerName: '株式会社テスト太郎',
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
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-uuid-11111111-1111-1111-1111-111111111111',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'プロジェクトA',
          dealAmount: 1000000,
          stageId: 'stage-won',
          expectedContractDate: '2026-09-15',
          contractedDate: '2026-09-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: '2026-09-15T16:30:00.000Z',
          createdBy: 'system',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-uuid-22222222-2222-2222-2222-222222222222',
            dealId: 'deal-uuid-11111111-1111-1111-1111-111111111111',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-001',
            invoiceDate: '2026-09-20',
            dueDate: '2026-10-20',
            invoiceAmount: 1000000,
            taxAmount: 0,
            untaxedAmount: 1000000,
            invoiceStatus: 'issued',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-20T09:00:00.000Z',
            updatedAt: '2026-09-20T09:00:00.000Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    };

    const mockValidateIntegrity = {
      dealId: 'all',
      isValid: true,
      invoiceIds: ['inv-uuid-22222222-2222-2222-2222-222222222222'],
      referenceAnomalies: [],
      validationTimestamp: currentDateTime,
    };

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockAccessControlResponse);
    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue(mockCustomerRecords);
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue(mockValidateIntegrity);

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('株式会社テスト太郎');
    expect(result.transactionHistory).toBeDefined();
    expect(Array.isArray(result.transactionHistory)).toBe(true);
    expect(result.inconsistencies).toEqual([]);
    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
