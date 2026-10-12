import { displayCustomerTransactionHistory, SpecialInvoiceStatusDetected } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-reconciliation');

describe('SCEN-452: エラー：請求レコードにキャンセル・返金・修正請求のステータスが存在する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SpecialInvoiceStatusDetected 例外が発生する', async () => {
    const customerId = 'cust-uuid-001';
    const loginUserId = 'user-uuid-001';
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
        customerName: 'テスト顧客',
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
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          salesRepresentativeId: 'sales-001',
          dealName: '案件A',
          dealAmount: 500000,
          stageId: 'stage-won',
          expectedContractDate: '2026-09-01',
          contractedDate: '2026-09-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
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
            invoiceDate: '2026-09-15',
            dueDate: '2026-10-15',
            invoiceAmount: 500000,
            taxAmount: 0,
            untaxedAmount: 500000,
            invoiceStatus: 'cancelled',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-15T00:00:00.000Z',
            updatedAt: '2026-09-15T00:00:00.000Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
        {
          invoice: {
            invoiceId: 'inv-002',
            dealId: 'deal-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-002',
            invoiceDate: '2026-09-20',
            dueDate: '2026-10-20',
            invoiceAmount: 500000,
            taxAmount: 0,
            untaxedAmount: 500000,
            invoiceStatus: 'refunded',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-20T00:00:00.000Z',
            updatedAt: '2026-09-20T00:00:00.000Z',
            createdBy: 'system',
          },
          lineItems: [],
        },
        {
          invoice: {
            invoiceId: 'inv-003',
            dealId: 'deal-001',
            customerId,
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-003',
            invoiceDate: '2026-09-25',
            dueDate: '2026-10-25',
            invoiceAmount: 500000,
            taxAmount: 0,
            untaxedAmount: 500000,
            invoiceStatus: 'revised',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 1,
            lastReissuedAt: '2026-09-25T00:00:00.000Z',
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-25T00:00:00.000Z',
            updatedAt: '2026-09-25T00:00:00.000Z',
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
      invoiceIds: ['inv-001', 'inv-002', 'inv-003'],
      referenceAnomalies: [],
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
    ).rejects.toThrow(SpecialInvoiceStatusDetected);

    await expect(
      displayCustomerTransactionHistory({
        customerId,
        loginUserId,
        currentDateTime,
      }),
    ).rejects.toThrow('キャンセル・返金・修正請求が含まれています。詳細は画面上で視覚的に区別表示されます。');
  });
});
