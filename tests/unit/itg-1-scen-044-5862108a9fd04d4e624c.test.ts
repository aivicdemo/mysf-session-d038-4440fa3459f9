import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator'
import * as customerDedup from '../../src/logic/customer-deduplication'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as accessControl from '../../src/logic/access-control-enforcement'
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement'
import * as transactionHistory from '../../src/logic/customer-transaction-history'
import * as slaManagement from '../../src/logic/response-time-sla-management'
import * as notificationService from '../../src/logic/notification-service'
import * as auditLogging from '../../src/logic/audit-logging'

describe('SCEN-044: 問い合わせ内容が必須項目を満たさない場合、ステータスが failed で InquiryContentInvalid エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return failed status with InquiryContentInvalid error when inquiry content type is empty', async () => {
    const result = await runTx7Imp1Agent(
      {
        inquiryId: 'INQ-20250107-001',
        inquirerIdentification: {
          name: '山田太郎',
          email: 'yamada@example.com',
          phoneNumber: '090-1234-5678',
          companyName: '株式会社ABC',
        },
        inquiryContent: {
          type: '', // 空文字列: 必須項目を満たさない
          subject: '請求書について',
          description: '先月の請求書が届きません',
          attachmentUrls: [],
        },
        receivedDateTime: new Date('2025-01-07T10:30:00Z'),
        userId: 'USER-002',
        deviceContext: {
          deviceType: 'desktop',
          ipAddress: '192.168.1.100',
          sessionId: 'SESSION-20250107-001',
        },
      },
      {} as Tx7Imp1AiClient,
    )

    expect(result.status).toBe('failed')
    expect(result.inquiryId).toBe('INQ-20250107-001')
    expect(result.errorDetails).toBeDefined()
    expect(result.errorDetails?.errorName).toBe('InquiryContentInvalid')
    expect(result.errorDetails?.errorMessage).toBe('問い合わせ内容が不完全です。問い合わせ種別、内容、連絡先を確認してください。')
    expect(result.identifiedCustomerId).toBeNull()
    expect(result.responseContent).toBeUndefined()
    expect(result.notificationSent).toBe(false)
  })
})
