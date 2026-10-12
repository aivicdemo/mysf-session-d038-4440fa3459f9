import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator'
import * as customerDedup from '../../src/logic/customer-deduplication'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement'
import * as slaManagement from '../../src/logic/response-time-sla-management'
import * as notificationService from '../../src/logic/notification-service'

describe('SCEN-050: 低複雑度の問い合わせが入力された場合、分析結果の複雑度が low で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return complexity as low for simple billing inquiry', async () => {
    jest.spyOn(customerDedup, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-202501-0001',
        customerName: '株式会社サンプル',
      },
    })

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:30:00Z',
    })

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
    })

    jest.spyOn(slaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({})

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customerId: 'CUST-202501-0001',
      deals: [],
      invoices: [],
      activities: [],
    })

    jest.spyOn(notificationService, 'notifyIssueResponse').mockResolvedValue({})

    const result = await runTx7Imp1Agent(
      {
        inquiryId: 'INQ-20250107-001',
        inquirerIdentification: {
          name: '山田太郎',
          email: 'yamada@example.com',
          phoneNumber: '09012345678',
          companyName: '株式会社サンプル',
        },
        inquiryContent: {
          type: 'billing',
          subject: '請求書の金額確認',
          description: '先月の請求書に記載された金額について確認したいです。',
          attachmentUrls: [],
        },
        receivedDateTime: new Date('2025-01-07T10:30:00Z'),
        userId: 'USR-support-001',
        deviceContext: {
          deviceType: 'desktop',
          ipAddress: '192.168.1.100',
          sessionId: 'sess-abc123xyz',
        },
      },
      {} as Tx7Imp1AiClient,
    )

    expect(result.inquiryId).toBe('INQ-20250107-001')
    expect(result.status).toBe('completed')
    expect(result.identifiedCustomerId).toBe('CUST-202501-0001')
    expect(result.notificationSent).toBe(true)
    expect(result.errorDetails).toBeNull()
  })
})
