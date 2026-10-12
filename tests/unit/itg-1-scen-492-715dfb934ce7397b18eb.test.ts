import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history'
import type {
  DisplayCustomerTransactionHistoryInput,
} from '../../src/logic/customer-transaction-history'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation'
import * as accessControl from '../../src/logic/access-control-enforcement'

jest.mock('../../src/logic/data-persistence')
jest.mock('../../src/logic/deal-invoice-reconciliation')
jest.mock('../../src/logic/access-control-enforcement')

describe('SCEN-492: 商談IDが空または不正な形式の場合、「商談IDが指定されていません」例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should throw error when deal ID is invalid', async () => {
    const customerId = 'CUST-001'
    const loginUserId = 'USER-001'
    const currentDateTime = new Date('2026-10-07T12:00:00Z')

    jest.spyOn(accessControl, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: ['DEAL-001'],
        visibleInvoiceIds: ['INV-001'],
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
        updatedAt: '2026-09-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: '', // Empty deal ID
          customerId,
          dealName: '商談A',
          dealAmount: 100000,
          stageId: 'stage-001',
          expectedContractDate: '2026-09-30',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-01T10:00:00Z',
          createdBy: 'user-001',
          salesRepresentativeId: 'rep-001',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'INV-001',
            invoiceNumber: 'INV-2026-001',
            dealId: 'DEAL-001',
            customerId,
            salesRepresentativeId: 'rep-001',
            invoiceDate: '2026-09-15',
            dueDate: '2026-10-15',
            invoiceAmount: 100000,
            taxAmount: 0,
            untaxedAmount: 100000,
            invoiceStatus: '確定済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-15T10:00:00Z',
            updatedAt: '2026-09-15T10:00:00Z',
            createdBy: 'user-001',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    })

    jest.spyOn(dealInvoiceReconciliation, 'validateInvoiceReferenceIntegrity').mockResolvedValue({
      dealId: 'DEAL-001',
      isValid: true,
      invoiceIds: ['INV-001'],
      referenceAnomalies: [],
      validationTimestamp: new Date(),
    })

    const input: DisplayCustomerTransactionHistoryInput = {
      customerId,
      loginUserId,
      currentDateTime,
    }

    await expect(displayCustomerTransactionHistory(input)).rejects.toThrow()
  })
})
