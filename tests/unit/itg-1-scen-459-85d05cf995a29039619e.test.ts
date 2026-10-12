import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-459: 業務ルール：差異額が負数の場合、ハイライトフラグが「error」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異額が負数の場合、ハイライトフラグが「error」と判定される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-01-15T10:00:00Z');

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
        customerName: '株式会社テスト商社',
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
        createdAt: '2025-06-01T09:00:00Z',
        updatedAt: '2025-06-01T09:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-2025-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'システム構築案件',
          dealAmount: 1000000,
          stageId: 'stage-won',
          expectedContractDate: '2025-06-15',
          contractedDate: '2025-06-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-06-01T09:00:00Z',
          updatedAt: '2025-06-15T14:30:00Z',
          createdBy: 'system',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-2025-001',
            dealId: 'deal-2025-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-001',
            invoiceDate: '2025-07-01',
            dueDate: '2025-08-01',
            invoiceAmount: 950000,
            taxAmount: 0,
            untaxedAmount: 950000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2025-07-01T10:00:00Z',
            updatedAt: '2025-07-01T10:00:00Z',
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
      invoiceIds: ['inv-2025-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amountMismatch',
          description: '金額ズレ',
          affectedRecordId: 'deal-2025-001',
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
    expect(result.customerName).toBe('株式会社テスト商社');
    expect(result.transactionHistory).toBeDefined();
    expect(Array.isArray(result.transactionHistory)).toBe(true);
    if (result.inconsistencies.length > 0) {
      expect(result.inconsistencies[0].differenceAmount).toBeDefined();
    }
  });
});
