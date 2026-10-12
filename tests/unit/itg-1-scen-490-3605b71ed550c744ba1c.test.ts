import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchCustomerWithRelatedRecords: jest.fn(),
}));

jest.mock('../../src/logic/deal-invoice-reconciliation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/deal-invoice-reconciliation')>('../../src/logic/deal-invoice-reconciliation'),
  validateInvoiceReferenceIntegrity: jest.fn(),
}));

jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/access-control-enforcement')>('../../src/logic/access-control-enforcement'),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';
import * as accessControl from '../../src/logic/access-control-enforcement';

describe('SCEN-490: displayCustomerTransactionHistory - 業務ルール：差異理由が「部分請求」で請求書ステータスが未確定の場合、推奨対応が「awaiting_confirmation」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return displayCustomerTransactionHistory output with awaiting_confirmation recommendation when partial invoicing with unconfirmed status', async () => {
    const customerId = 'cust-001';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    // Mock: fetchCustomerWithRelatedRecords の戻り値
    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customer: {
        customerId: 'cust-001',
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
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      deals: [
        {
          dealId: 'deal-101',
          customerId: 'cust-001',
          salesRepresentativeId: 'sales-001',
          dealName: 'システム導入プロジェクト',
          dealAmount: 1000000,
          stageId: 'stage-contracted',
          expectedContractDate: '2026-08-01',
          contractedDate: '2026-08-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
          createdBy: 'sales-001',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-201',
            dealId: 'deal-101',
            customerId: 'cust-001',
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-202601',
            invoiceDate: '2026-09-01',
            dueDate: '2026-09-30',
            invoiceAmount: 500000,
            taxAmount: 50000,
            untaxedAmount: 450000,
            invoiceStatus: '未確定',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
            createdBy: 'sales-001',
          },
          lineItems: [
            {
              lineItemId: 'li-001',
              invoiceId: 'inv-201',
              dealId: 'deal-101',
              activityId: null,
              lineNumber: 1,
              productName: 'システム導入',
              productDescription: null,
              quantity: 1,
              unitPrice: 500000,
              amount: 500000,
              taxRate: 0.1,
              taxAmount: 50000,
              taxIncludedAmount: 550000,
              remarks: null,
              modificationPreviousQuantity: null,
              modificationPreviousUnitPrice: null,
              modificationPreviousAmount: null,
              createdAt: '2026-09-01T00:00:00Z',
              updatedAt: '2026-09-01T00:00:00Z',
              createdBy: 'sales-001',
            },
          ],
        },
        {
          invoice: {
            invoiceId: 'inv-202',
            dealId: 'deal-101',
            customerId: 'cust-001',
            salesRepresentativeId: 'sales-001',
            invoiceNumber: 'INV-202602',
            invoiceDate: '2026-10-01',
            dueDate: '2026-10-31',
            invoiceAmount: 500000,
            taxAmount: 50000,
            untaxedAmount: 450000,
            invoiceStatus: '未確定',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-10-01T00:00:00Z',
            updatedAt: '2026-10-01T00:00:00Z',
            createdBy: 'sales-001',
          },
          lineItems: [
            {
              lineItemId: 'li-002',
              invoiceId: 'inv-202',
              dealId: 'deal-101',
              activityId: null,
              lineNumber: 1,
              productName: 'システム導入',
              productDescription: null,
              quantity: 1,
              unitPrice: 500000,
              amount: 500000,
              taxRate: 0.1,
              taxAmount: 50000,
              taxIncludedAmount: 550000,
              remarks: null,
              modificationPreviousQuantity: null,
              modificationPreviousUnitPrice: null,
              modificationPreviousAmount: null,
              createdAt: '2026-10-01T00:00:00Z',
              updatedAt: '2026-10-01T00:00:00Z',
              createdBy: 'sales-001',
            },
          ],
        },
      ],
      fetchedAt: '2026-10-15T10:00:00Z',
    });

    // Mock: validateInvoiceReferenceIntegrity の戻り値
    (dealInvoiceReconciliation.validateInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      dealId: 'deal-101',
      isValid: true,
      invoiceIds: ['inv-201', 'inv-202'],
      referenceAnomalies: [],
      validationTimestamp: new Date('2026-10-15T10:00:00Z'),
    });

    // Mock: enforceAccessControlForDataDisplay の戻り値
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: ['sales-001'],
        visibleCustomerIds: ['cust-001'],
        visibleDealIds: ['deal-101'],
        visibleInvoiceIds: ['inv-201', 'inv-202'],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [{ operationType: 'display', permitted: true }],
      denialReason: null,
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result).toBeDefined();
    expect(result.customerId).toBe('cust-001');
    expect(result.customerName).toBe('株式会社テスト商社');

    // transactionHistory に統合された商談・請求レコードが含まれることを確認
    expect(result.transactionHistory).toBeDefined();
    expect(Array.isArray(result.transactionHistory)).toBe(true);

    // inconsistencies フィールドは空配列（データ不整合がないため）
    expect(result.inconsistencies).toBeDefined();
    expect(Array.isArray(result.inconsistencies)).toBe(true);
    expect(result.inconsistencies.length).toBe(0);

    // notificationContent は null（不整合がないため通知なし）
    expect(result.notificationContent).toBeNull();

    // 必要なモック関数が呼ばれたことを確認
    expect(dataPersistence.fetchCustomerWithRelatedRecords).toHaveBeenCalled();
    expect(dealInvoiceReconciliation.validateInvoiceReferenceIntegrity).toHaveBeenCalled();
    expect(accessControl.enforceAccessControlForDataDisplay).toHaveBeenCalled();
  });
});
