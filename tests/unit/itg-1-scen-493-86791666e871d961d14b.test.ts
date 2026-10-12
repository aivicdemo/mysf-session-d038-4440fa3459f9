import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history'
import type {
  DisplayCustomerTransactionHistoryInput,
  DisplayCustomerTransactionHistoryOutput,
  TransactionInconsistency,
} from '../../src/logic/customer-transaction-history'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation'
import * as accessControl from '../../src/logic/access-control-enforcement'

jest.mock('../../src/logic/data-persistence')
jest.mock('../../src/logic/deal-invoice-reconciliation')
jest.mock('../../src/logic/access-control-enforcement')

describe('SCEN-493: 商談金額が負数の場合、「商談金額が負数です。値を確認してください」警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should record warning when deal amount is negative', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000'
    const loginUserId = 'user-001'
    const currentDateTime = new Date('2026-10-07T10:00:00.000Z')

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
        updatedAt: '2026-09-15T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          dealName: '契約A',
          dealAmount: -50000, // Negative amount
          stageId: 'stage-001',
          expectedContractDate: '2026-09-30',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-15T00:00:00Z',
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
            invoiceDate: '2026-09-16',
            dueDate: '2026-10-16',
            invoiceAmount: 0,
            taxAmount: 0,
            untaxedAmount: 0,
            invoiceStatus: '下書き',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-16T10:00:00Z',
            updatedAt: '2026-09-16T10:00:00Z',
            createdBy: 'user-001',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    })

    jest.spyOn(dealInvoiceReconciliation, 'validateInvoiceReferenceIntegrity').mockResolvedValue({
      dealId: 'deal-001',
      isValid: false,
      invoiceIds: ['inv-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amount_mismatch',
          description: '商談金額が負数です。値を確認してください',
          affectedRecordId: 'deal-001',
        },
      ],
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
    expect(result.inconsistencies).toBeDefined()
    expect(Array.isArray(result.inconsistencies)).toBe(true)
    if (result.inconsistencies.length > 0) {
      const inconsistency: TransactionInconsistency = result.inconsistencies[0]
      expect(inconsistency.dealId).toBe('deal-001')
      expect(inconsistency.inconsistencyType).toBe('amount_mismatch')
    }
    if (result.notificationContent) {
      expect(result.notificationContent).toContain('商談金額が負数です。値を確認してください')
    }
  })
})
