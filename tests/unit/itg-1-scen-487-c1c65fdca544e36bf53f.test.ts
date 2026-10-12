import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history'
import type {
  DisplayCustomerTransactionHistoryInput,
  DisplayCustomerTransactionHistoryOutput,
} from '../../src/logic/customer-transaction-history'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation'
import * as accessControl from '../../src/logic/access-control-enforcement'

jest.mock('../../src/logic/data-persistence')
jest.mock('../../src/logic/deal-invoice-reconciliation')
jest.mock('../../src/logic/access-control-enforcement')

describe('SCEN-487: 請求書明細が一部確定済みの場合、invoiceStatusSummary が「partially_confirmed」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should determine invoice status as partially_confirmed when invoice details have mixed confirmation status', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000'
    const loginUserId = 'user-sales-001'
    const currentDateTime = new Date('2026-10-15T10:30:00Z')

    jest.spyOn(accessControl, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: ['deal-001'],
        visibleInvoiceIds: ['inv-001'],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [
        {
          operationType: 'view',
          permitted: true,
        },
      ],
    })

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
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
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-15T14:30:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          dealName: '営業成績：100万円',
          dealAmount: 1000000,
          stageId: 'stage-001',
          expectedContractDate: '2026-09-30',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T09:00:00Z',
          updatedAt: '2026-09-15T14:30:00Z',
          createdBy: 'user-001',
          salesRepresentativeId: 'rep-001',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-001',
            invoiceNumber: 'INV-2026-001',
            dealId: 'deal-001',
            customerId,
            salesRepresentativeId: 'rep-001',
            invoiceDate: '2026-09-20',
            dueDate: '2026-10-20',
            invoiceAmount: 1000000,
            taxAmount: 0,
            untaxedAmount: 1000000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-20T10:00:00Z',
            updatedAt: '2026-09-20T10:00:00Z',
            createdBy: 'user-001',
          },
          lineItems: [
            {
              lineItemId: 'detail-001',
              invoiceId: 'inv-001',
              dealId: 'deal-001',
              activityId: null,
              lineNumber: 1,
              productName: 'Service',
              productDescription: null,
              quantity: 1,
              unitPrice: 500000,
              amount: 500000,
              taxRate: 0,
              taxAmount: 0,
              taxIncludedAmount: 500000,
              remarks: null,
              modificationPreviousQuantity: null,
              modificationPreviousUnitPrice: null,
              modificationPreviousAmount: null,
              createdAt: '2026-09-20T10:00:00Z',
              updatedAt: '2026-09-20T10:00:00Z',
              createdBy: 'user-001',
            },
            {
              lineItemId: 'detail-002',
              invoiceId: 'inv-001',
              dealId: 'deal-001',
              activityId: null,
              lineNumber: 2,
              productName: 'Service',
              productDescription: null,
              quantity: 1,
              unitPrice: 500000,
              amount: 500000,
              taxRate: 0,
              taxAmount: 0,
              taxIncludedAmount: 500000,
              remarks: null,
              modificationPreviousQuantity: null,
              modificationPreviousUnitPrice: null,
              modificationPreviousAmount: null,
              createdAt: '2026-09-20T10:00:00Z',
              updatedAt: '2026-09-20T10:00:00Z',
              createdBy: 'user-001',
            },
          ],
        },
      ],
      fetchedAt: new Date().toISOString(),
    })

    jest.spyOn(dealInvoiceReconciliation, 'validateInvoiceReferenceIntegrity').mockResolvedValue({
      dealId: 'deal-001',
      isValid: true,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [],
      validationTimestamp: new Date(),
    })

    const input: DisplayCustomerTransactionHistoryInput = {
      customerId,
      loginUserId,
      currentDateTime,
    }

    const result: DisplayCustomerTransactionHistoryOutput = await displayCustomerTransactionHistory(input)

    expect(result).toBeDefined()
    expect(result.customerId).toBe(customerId)
    expect(result.customerName).toBe('テスト顧客')
    expect(result.transactionHistory).toBeDefined()
    expect(Array.isArray(result.transactionHistory)).toBe(true)
    expect(result.inconsistencies).toEqual([])
    expect(result.specialInvoiceStatuses).toEqual([])
    expect(result.notificationContent).toBeNull()
  })
})
