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

describe('SCEN-486: 業務ルール：請求書明細がすべて確定済みの場合、請求書ステータスサマリーが「all_confirmed」と判定される', () => {
  it('should identify all_confirmed status when all invoice line items are confirmed', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    jest.mocked(accessControl.enforceAccessControlForDataDisplay).mockResolvedValue({
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
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      } as any,
      deals: [
        {
          dealId: 'deal-001',
          dealName: '契約A',
          dealAmount: 100000,
          stageId: 'stage-won',
          expectedContractDate: '2026-01-15',
          contractedDate: '2026-01-20',
          createdAt: '2026-01-15T00:00:00Z',
          updatedAt: '2026-01-20T00:00:00Z',
          createdBy: 'user-001',
        } as any,
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-001',
            dealId: 'deal-001',
            invoiceAmount: 100000,
            invoiceStatus: 'confirmed',
            invoiceDate: '2026-02-01T00:00:00Z',
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            createdAt: '2026-02-01T00:00:00Z',
            updatedAt: '2026-02-01T00:00:00Z',
            createdBy: 'user-001',
            customerId,
            salesRepresentativeId: 'user-001',
            invoiceNumber: 'INV-001',
            dueDate: '2026-03-01',
            taxAmount: 0,
            untaxedAmount: 100000,
            paidDate: null,
            paidAmount: null,
            remarks: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
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
              unitPrice: 100000,
              amount: 100000,
              taxRate: 0,
              taxAmount: 0,
              taxIncludedAmount: 100000,
              remarks: null,
              modificationPreviousQuantity: null,
              modificationPreviousUnitPrice: null,
              modificationPreviousAmount: null,
              createdAt: '2026-02-01T00:00:00Z',
              updatedAt: '2026-02-01T00:00:00Z',
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
      isValid: true,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [],
      validationTimestamp: currentDateTime,
    } as any);

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('Customer A');
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory.length).toBeGreaterThan(0);

    const dealRecord = result.transactionHistory.find(
      (rec) => rec.recordType === 'deal' && rec.recordId === 'deal-001'
    );
    expect(dealRecord).toBeDefined();
    expect(dealRecord?.amount).toBe(100000);

    const invoiceRecord = result.transactionHistory.find(
      (rec) => rec.recordType === 'invoice' && rec.recordId === 'inv-001'
    );
    expect(invoiceRecord).toBeDefined();
    expect(invoiceRecord?.amount).toBe(100000);
    expect(invoiceRecord?.status).toBe('confirmed');

    expect(result.inconsistencies).toBeDefined();
    expect(result.inconsistencies.length).toBe(0);

    expect(result.specialInvoiceStatuses).toBeDefined();
    expect(result.specialInvoiceStatuses.length).toBe(0);

    expect(result.notificationContent).toBeNull();
  });
});
