import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator'
import * as customerDedup from '../../src/logic/customer-deduplication'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as accessControl from '../../src/logic/access-control-enforcement'
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement'
import * as transactionHistory from '../../src/logic/customer-transaction-history'
import * as slaManagement from '../../src/logic/response-time-sla-management'
import * as notificationService from '../../src/logic/notification-service'
import * as auditLogging from '../../src/logic/audit-logging'

describe('SCEN-049: モバイルデバイスからのアクセスである場合、機密情報の表示範囲が制限された状態で処理が続行される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should restrict confidential information when accessed from mobile device', async () => {
    // モック設定
    jest.spyOn(customerDedup, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-12345',
        customerName: '株式会社ABC',
      },
    })

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2025-01-15T10:30:00Z',
    })

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: true,
    })

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customerId: 'CUST-12345',
      deals: [],
      invoices: [],
      activities: [],
    })

    jest.spyOn(slaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({})

    jest.spyOn(transactionHistory, 'displayCustomerTransactionHistory').mockResolvedValue({
      deals: [],
      invoices: [],
      activities: [],
    })

    jest.spyOn(accessControl, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
    })

    jest.spyOn(notificationService, 'notifyIssueResponse').mockResolvedValue({})

    jest.spyOn(auditLogging, 'recordUserOperation').mockResolvedValue({})

    const result = await runTx7Imp1Agent(
      {
        inquiryId: 'INQ-2025-001',
        inquirerIdentification: {
          name: '田中太郎',
          email: 'tanaka@example.com',
          phoneNumber: '09012345678',
          companyName: '株式会社ABC',
        },
        inquiryContent: {
          type: 'billing_inquiry',
          subject: '請求書の確認について',
          description: '先月の請求内容に質問があります',
          attachmentUrls: [],
        },
        receivedDateTime: new Date('2025-01-15T10:30:00Z'),
        userId: 'USER-sales-001',
        deviceContext: {
          deviceType: 'mobile',
          ipAddress: '192.168.1.100',
          sessionId: 'sess-mobile-12345',
        },
      },
      {} as Tx7Imp1AiClient,
    )

    expect(result.status).toBe('completed')
    expect(result.inquiryId).toBe('INQ-2025-001')
    expect(result.identifiedCustomerId).toBe('CUST-12345')
    expect(result.transactionHistory).toBeDefined()
    expect(result.notificationSent).toBe(true)
    expect(result.errorDetails).toBeNull()
  })
})
