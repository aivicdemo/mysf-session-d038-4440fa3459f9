import { displayCustomerTransactionHistory, AmountMismatchDetected } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-453: エラー：商談と請求のデータ不整合（金額ズレ・未請求・ステータス不整合）が検出された場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AmountMismatchDetected 例外が発生する', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-15T10:30:00Z');

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
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'A社 システム導入',
          dealAmount: 1000000,
          stageId: 'stage-won',
          expectedContractDate: '2026-08-15',
          contractedDate: '2026-08-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-08-01T09:00:00Z',
          updatedAt: '2026-08-15T14:30:00Z',
          createdBy: 'system',
        },
        {
          dealId: 'deal-002',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: 'B社 保守契約',
          dealAmount: 500000,
          stageId: 'stage-won',
          expectedContractDate: '2026-09-10',
          contractedDate: '2026-09-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-10T11:00:00Z',
          createdBy: 'system',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-001',
            dealId: 'deal-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-001',
            invoiceDate: '2026-08-20',
            dueDate: '2026-09-20',
            invoiceAmount: 900000,
            taxAmount: 0,
            untaxedAmount: 900000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-08-20T08:00:00Z',
            updatedAt: '2026-08-20T08:00:00Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
        {
          invoice: {
            invoiceId: 'inv-002',
            dealId: 'deal-002',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-002',
            invoiceDate: '2026-09-15',
            dueDate: '2026-10-15',
            invoiceAmount: 500000,
            taxAmount: 0,
            untaxedAmount: 500000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-15T09:00:00Z',
            updatedAt: '2026-09-15T09:00:00Z',
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
      invoiceIds: ['inv-001', 'inv-002'],
      referenceAnomalies: [
        {
          anomalyType: '金額ズレ',
          description: 'deal-001 と inv-001 の間で 100,000 円のズレ',
          affectedRecordId: 'deal-001',
        },
      ],
      validationTimestamp: currentDateTime,
    };

    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockAccessControlResponse);
    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue(mockCustomerRecords);
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue(mockValidateIntegrity);

    await expect(
      displayCustomerTransactionHistory({
        customerId,
        loginUserId,
        currentDateTime,
      }),
    ).rejects.toThrow(AmountMismatchDetected);

    await expect(
      displayCustomerTransactionHistory({
        customerId,
        loginUserId,
        currentDateTime,
      }),
    ).rejects.toThrow('商談金額と請求金額に差異があります。差異額と理由は画面上でハイライト表示されます。');
  });
});
