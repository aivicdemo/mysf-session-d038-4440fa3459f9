import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator'
import * as customerDedup from '../../src/logic/customer-deduplication'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement'
import * as slaManagement from '../../src/logic/response-time-sla-management'
import * as notificationService from '../../src/logic/notification-service'

describe('SCEN-051: 中複雑度の問い合わせが入力された場合、分析結果の複雑度が medium で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return complexity as medium for complex billing inquiry involving multiple deals', async () => {
    jest.spyOn(customerDedup, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-2024-0456',
        customerName: '株式会社ABC',
      },
    })

    jest.spyOn(slaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({})

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customerId: 'CUST-2024-0456',
      deals: [],
      invoices: [],
      activities: [],
    })

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2024-01-15T10:30:00Z',
    })

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
    })

    jest.spyOn(notificationService, 'notifyIssueResponse').mockResolvedValue({})

    const result = await runTx7Imp1Agent(
      {
        inquiryId: 'INQ-20240115-005',
        inquirerIdentification: {
          name: '田中太郎',
          email: 'tanaka@example.com',
          phoneNumber: '090-1234-5678',
          companyName: '株式会社ABC',
        },
        inquiryContent: {
          type: 'billing_inquiry',
          subject: '先月の請求書に関する質問',
          description:
            '請求書INV-2024-001の金額が前月比で30%増加しています。原因と詳細な明細を確認したいです。複数の商談が関連しており、各商談での請求額の根拠を知りたいです。',
          attachmentUrls: [],
        },
        receivedDateTime: new Date('2024-01-15T10:30:00Z'),
        userId: 'USER-2024-001',
        deviceContext: {
          deviceType: 'desktop',
          ipAddress: '192.168.1.100',
          sessionId: 'SESSION-ABC123',
        },
      },
      {} as Tx7Imp1AiClient,
    )

    expect(result.status).toBe('completed')
    expect(result.identifiedCustomerId).toBe('CUST-2024-0456')
    expect(result.transactionHistory).toBeDefined()
    expect(result.notificationSent).toBe(true)
    expect(result.errorDetails).toBeNull()
  })
})
