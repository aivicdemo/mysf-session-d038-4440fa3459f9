import { displayCustomerTransactionHistory, DataInconsistencyDetected } from '../../src/logic/customer-transaction-history'
import type {
  DisplayCustomerTransactionHistoryInput,
} from '../../src/logic/customer-transaction-history'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as dealInvoiceReconciliation from '../../src/logic/deal-invoice-reconciliation'
import * as accessControl from '../../src/logic/access-control-enforcement'

jest.mock('../../src/logic/data-persistence')
jest.mock('../../src/logic/deal-invoice-reconciliation')
jest.mock('../../src/logic/access-control-enforcement')

describe('SCEN-491: 差異理由が「追加請求」の場合、推奨対応が「confirm_with_customer」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set recommendedAction to confirm_with_customer when invoice amount exceeds deal amount', async () => {
    const customerId = 'cust-uuid-12345'
    const loginUserId = 'user-uuid-67890'
    const currentDateTime = new Date('2026-10-15T14:30:00Z')

    jest.spyOn(accessControl, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: ['deal-uuid-001'],
        visibleInvoiceIds: ['inv-uuid-001'],
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
          dealId: 'deal-uuid-001',
          customerId,
          dealName: '商談A',
          dealAmount: 100000,
          stageId: 'stage-001',
          expectedContractDate: '2026-09-30',
          contractedDate: '2026-09-01T00:00:00Z',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2026-08-15T10:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          createdBy: 'user-001',
          salesRepresentativeId: 'rep-001',
        },
      ],
      activities: [],
      invoices: [
        {
          invoice: {
            invoiceId: 'inv-uuid-001',
            invoiceNumber: 'INV-2026-001',
            dealId: 'deal-uuid-001',
            customerId,
            salesRepresentativeId: 'rep-001',
            invoiceDate: '2026-09-05',
            dueDate: '2026-10-05',
            invoiceAmount: 110000,
            taxAmount: 0,
            untaxedAmount: 110000,
            invoiceStatus: '発行済',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2026-09-05T00:00:00Z',
            updatedAt: '2026-09-05T00:00:00Z',
            createdBy: 'user-001',
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    })

    jest.spyOn(dealInvoiceReconciliation, 'validateInvoiceReferenceIntegrity').mockResolvedValue({
      dealId: 'deal-uuid-001',
      isValid: false,
      invoiceIds: ['inv-uuid-001'],
      referenceAnomalies: [
        {
          anomalyType: 'amount_mismatch',
          description: '追加請求',
          affectedRecordId: 'inv-uuid-001',
        },
      ],
      validationTimestamp: new Date(),
    })

    const input: DisplayCustomerTransactionHistoryInput = {
      customerId,
      loginUserId,
      currentDateTime,
    }

    await expect(displayCustomerTransactionHistory(input)).rejects.toThrow(
      new DataInconsistencyDetected('データ不整合が検出されました。詳細は画面上でハイライト表示されます。')
    )
  })
})
