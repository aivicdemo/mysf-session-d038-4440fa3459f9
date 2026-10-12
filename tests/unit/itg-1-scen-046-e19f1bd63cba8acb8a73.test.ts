import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator'
import * as customerDedup from '../../src/logic/customer-deduplication'
import * as dataPersistence from '../../src/logic/data-persistence'
import * as accessControl from '../../src/logic/access-control-enforcement'
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement'

describe('SCEN-046: ユーザーが問い合わせ内容に含まれる顧客情報へのアクセス権限を持たない場合、ステータスが failed で AccessDenied エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return failed status with AccessDenied error when user has no access to customer data', async () => {
    // モック設定: 顧客の既存レコード
    jest.spyOn(customerDedup, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-1001',
        customerName: '株式会社ABC',
      },
    })

    // モック設定: ユーザーのアクセス権限（アクセス不可の権限レコード）
    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [
        {
          permissionId: 'PERM-001',
          userId: 'USER-002',
          permissionCode: 'VIEW_LIMITED',
          permissionName: '限定閲覧',
          description: '一部顧客データのみ表示可能',
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    })

    jest.spyOn(accessControl, 'enforceAccessControlForDataDisplay').mockRejectedValue(
      new Error('Access denied'),
    )

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
    })

    const result = await runTx7Imp1Agent(
      {
        inquiryId: 'INQ-2024-001',
        inquirerIdentification: {
          name: '山田太郎',
          email: 'yamada@example.com',
          phoneNumber: '09012345678',
          companyName: '株式会社ABC',
        },
        inquiryContent: {
          type: 'billing',
          subject: '請求書の確認について',
          description: '先月の請求内容に関する質問があります',
          attachmentUrls: [],
        },
        receivedDateTime: new Date('2024-01-15T10:30:00Z'),
        userId: 'USER-002',
        deviceContext: {
          deviceType: 'desktop',
          ipAddress: '192.168.1.100',
          sessionId: 'SESSION-12345',
        },
      },
      {} as Tx7Imp1AiClient,
    )

    expect(result.status).toBe('failed')
    expect(result.inquiryId).toBe('INQ-2024-001')
    expect(result.identifiedCustomerId).toBe('CUST-1001')
    expect(result.errorDetails).toBeDefined()
    expect(result.errorDetails?.errorName).toBe('AccessDenied')
    expect(result.errorDetails?.errorMessage).toBe('この顧客情報へのアクセス権限がありません。')
    expect(result.responseContent).toBeUndefined()
    expect(result.notificationSent).toBe(false)
    expect(result.escalationReason).toBeNull()
    expect(result.escalatedToUserId).toBeNull()
    expect(result.completedDateTime).toBeDefined()
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)
  })
})
