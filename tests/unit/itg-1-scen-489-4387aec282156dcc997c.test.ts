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

describe('SCEN-489: 差異理由が「未請求」の場合、推奨対応が「awaiting_invoice」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set recommendedAction to awaiting_invoice when invoice is not issued', async () => {
    const customerId = 'cust-001'
    const loginUserId = 'user-sales-001'
    const currentDateTime = new Date('2024-12-15T10:00:00Z')

    jest.spyOn(accessControl, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [customerId],
        visibleDealIds: ['deal-001'],
        visibleInvoiceIds: [],
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
        customerName: '株式会社テスト',
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
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-10-15T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
      },
      deals: [
        {
          dealId: 'deal-001',
          customerId,
          dealName: 'システム導入プロジェクト',
          dealAmount: 1000000,
          stageId: 'stage-001',
          expectedContractDate: '2024-10-30',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-15T00:00:00Z',
          createdBy: 'user-001',
          salesRepresentativeId: 'rep-001',
        },
      ],
      activities: [],
      invoices: [],
      fetchedAt: new Date().toISOString(),
    })

    jest.spyOn(dealInvoiceReconciliation, 'validateInvoiceReferenceIntegrity').mockResolvedValue({
      dealId: 'deal-001',
      isValid: false,
      invoiceIds: [],
      referenceAnomalies: [
        {
          anomalyType: 'not_invoiced',
          description: '未請求',
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

    await expect(displayCustomerTransactionHistory(input)).rejects.toThrow(
      new DataInconsistencyDetected('データ不整合が検出されました。詳細は画面上でハイライト表示されます。')
    )
  })
})
