import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-457: 業務ルール：商談ステータスが受注で請求書ステータスが未発行の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異理由が「ステータス不整合」と判定される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

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
        customerName: '顧客名',
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
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-2026-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'ABC社 システム導入',
          dealAmount: 500000,
          stageId: 'stage-won',
          expectedContractDate: '2026-09-15',
          contractedDate: '2026-09-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T09:00:00Z',
          updatedAt: '2026-09-15T14:30:00Z',
          createdBy: 'system',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-2026-001',
            dealId: 'deal-2026-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-001',
            invoiceDate: '2026-09-20',
            dueDate: '2026-10-20',
            invoiceAmount: 0,
            taxAmount: 0,
            untaxedAmount: 0,
            invoiceStatus: '未発行',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-20T08:00:00Z',
            updatedAt: '2026-09-20T08:00:00Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    };

    const mockValidateIntegrity = {
      dealId: 'all',
      isValid: false,
      invoiceIds: ['inv-2026-001'],
      referenceAnomalies: [
        {
          anomalyType: 'statusMismatch',
          description: 'ステータス不整合',
          affectedRecordId: 'deal-2026-001',
        },
      ],
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
    expect(result.customerName).toBe('顧客名');
    expect(result.transactionHistory).toBeDefined();
    expect(Array.isArray(result.transactionHistory)).toBe(true);
    expect(result.inconsistencies.length).toBeGreaterThan(0);
    expect(result.inconsistencies[0].reason).toContain('ステータス不整合');
  });
});
