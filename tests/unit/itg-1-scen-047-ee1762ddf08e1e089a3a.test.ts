import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator'
import * as customerDedup from '../../src/logic/customer-deduplication'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as accessControl from '../../src/logic/access-control-enforcement'
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement'

describe('SCEN-047: 顧客の商談・請求・活動履歴の取得に失敗した場合、ステータスが failed で HistoryRetrievalFailed エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return failed status with HistoryRetrievalFailed error when customer history retrieval fails', async () => {
    // モック設定: 顧客の既存レコード
    jest.spyOn(customerDedup, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-12345',
        customerName: '株式会社サンプル',
      },
    })

    // モック設定: ユーザーのアクセス権限
    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2024-01-15T10:00:00Z',
    })

    // モック設定: モバイルアクセス検出
    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
    })

    // モック設定: 顧客の商談・請求・活動履歴の取得が失敗
    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockRejectedValue(
      new Error('Failed to retrieve customer history'),
    )

    const result = await runTx7Imp1Agent(
      {
        inquiryId: 'INQ-20240115-001',
        inquirerIdentification: {
          name: '田中太郎',
          email: 'tanaka@example.com',
          phoneNumber: '09012345678',
          companyName: '株式会社サンプル',
        },
        inquiryContent: {
          type: 'billing_inquiry',
          subject: '請求書の内容確認',
          description: '2024年1月の請求内容について質問があります',
          attachmentUrls: [],
        },
        receivedDateTime: new Date('2024-01-15T10:00:00Z'),
        userId: 'USER-001',
        deviceContext: {
          deviceType: 'desktop',
          ipAddress: '192.168.1.100',
          sessionId: 'SESSION-12345',
        },
      },
      {} as Tx7Imp1AiClient,
    )

    expect(result.status).toBe('failed')
    expect(result.identifiedCustomerId).toBe('CUST-12345')
    expect(result.errorDetails).toBeDefined()
    expect(result.errorDetails?.errorName).toBe('HistoryRetrievalFailed')
    expect(result.errorDetails?.errorMessage).toBe('顧客履歴の取得に失敗しました。システム管理者に連絡してください。')
    expect(result.errorDetails?.errorCode).toBe('HistoryRetrievalFailed')
    expect(result.processingTimeMs).toBeGreaterThan(0)
    expect(result.completedDateTime).toBeDefined()
    expect(result.notificationSent).toBe(false)
    expect(result.responseContent).toBeUndefined()
  })
})
