import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/access-control-enforcement')>('../../src/logic/access-control-enforcement'),
  enforceAccessControlForDataDisplay: jest.fn(),
}));
jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchCustomerWithRelatedRecords: jest.fn(),
}));
jest.mock('../../src/logic/deal-invoice-reconciliation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/deal-invoice-reconciliation')>('../../src/logic/deal-invoice-reconciliation'),
  validateInvoiceReferenceIntegrity: jest.fn(),
}));

describe('SCEN-485: 業務ルール：請求金額が商談金額より多い場合、差異理由が「追加請求」と判定される', () => {
  it('should detect amount mismatch where invoice exceeds deal and classify reason as 追加請求', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-sales-001';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    jest.mocked(accessControl.enforceAccessControlForDataDisplay).mockResolvedValue({
      hasAccess: true,
      allowedDataRange: 'full',
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [loginUserId],
        visibleCustomerIds: [customerId],
        visibleDealIds: ['deal-001'],
        visibleInvoiceIds: ['inv-001'],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [],
    } as any);

    jest.mocked(dataPersistence.fetchCustomerWithRelatedRecords).mockResolvedValue({
      customer: {
        customerId,
        customerName: 'Customer A',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      } as any,
      deals: [
        {
          dealId: 'deal-001',
          dealName: '案件A',
          dealAmount: 100000,
          stageId: 'stage-won',
          expectedContractDate: '2026-09-01',
          contractedDate: '2026-09-01',
          createdAt: '2026-09-01T09:00:00Z',
          updatedAt: '2026-09-05T14:30:00Z',
          createdBy: 'user-001',
        } as any,
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-001',
            dealId: 'deal-001',
            invoiceAmount: 150000,
            invoiceStatus: 'issued',
            invoiceDate: '2026-09-10T10:00:00Z',
            createdAt: '2026-09-10T10:00:00Z',
            updatedAt: '2026-09-10T10:00:00Z',
            createdBy: 'user-001',
            dueDate: '2026-10-10',
            taxAmount: 0,
            untaxedAmount: 150000,
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            customerId,
            salesRepresentativeId: 'user-001',
            invoiceNumber: 'INV-001',
          } as any,
          lineItems: [
            {
              lineItemId: 'line-001',
              invoiceId: 'inv-001',
              dealId: 'deal-001',
              lineNumber: 1,
              productName: 'Product A',
              productDescription: null,
              quantity: 1,
              unitPrice: 150000,
              amount: 150000,
              taxRate: 0,
              taxAmount: 0,
              taxIncludedAmount: 150000,
              remarks: null,
              modificationPreviousQuantity: null,
              modificationPreviousUnitPrice: null,
              modificationPreviousAmount: null,
              createdAt: '2026-09-10T10:00:00Z',
              updatedAt: '2026-09-10T10:00:00Z',
              createdBy: 'user-001',
              activityId: null,
            } as any,
          ],
        },
      ],
      activities: [],
      fetchedAt: new Date().toISOString(),
    } as any);

    jest.mocked(dealInvoiceReconciliation.validateInvoiceReferenceIntegrity).mockResolvedValue({
      dealId: 'deal-001',
      isValid: false,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amountMismatch',
          description: 'Invoice amount exceeds deal amount',
          affectedRecordId: 'inv-001',
        },
      ],
      validationTimestamp: currentDateTime,
    } as any);

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory.length).toBeGreaterThan(0);
    expect(result.inconsistencies).toBeDefined();
    expect(result.inconsistencies.length).toBeGreaterThan(0);

    const amountMismatch = result.inconsistencies.find(
      (inc) => inc.inconsistencyType === 'amount_mismatch'
    );
    expect(amountMismatch).toBeDefined();
    expect(amountMismatch?.dealId).toBe('deal-001');
    expect(amountMismatch?.invoiceId).toBe('inv-001');
    expect(amountMismatch?.reason).toContain('追加請求');

    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent).toContain('商談金額と請求金額に差異があります');
  });
});
