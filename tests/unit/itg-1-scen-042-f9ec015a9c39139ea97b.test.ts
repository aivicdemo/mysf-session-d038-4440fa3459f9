import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('SCEN-042: 問い合わせ者の顧客情報が既存レコードに存在しない場合、ステータスが escalated でエスカレーションされ、CustomerNotFound エラーメッセージが返される', () => {
  it('エラー系: 顧客が見つからない場合、status=escalated でエスカレーションされる', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      deduplicateAndIdentifyCustomer: jest.fn().mockResolvedValue({
        identifiedCustomerId: null,
        customerDuplicateCandidates: [],
      }),
      fetchUserPermissions: jest.fn().mockResolvedValue({
        userId: 'USER-001',
        permissionLevel: 'standard',
        accessAllowed: true,
      }),
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({
        deviceType: 'desktop',
        restrictionApplied: false,
      }),
      fetchCustomerWithRelatedRecords: jest.fn().mockResolvedValue(null),
      evaluateAndEscalateInquiryResponseSLA: jest.fn().mockResolvedValue({
        complexity: 'low',
        requiresEscalation: false,
      }),
      notifyIssueResponse: jest.fn().mockResolvedValue({
        notificationSent: false,
      }),
      recordUserOperation: jest.fn().mockResolvedValue({
        operationId: 'OP-001',
        recordedAt: new Date(),
      }),
    };

    const input = {
      inquiryId: 'INQ-20250107-001',
      inquirerIdentification: {
        name: '田中太郎',
        email: 'tanaka.taro@example.com',
        phoneNumber: '09012345678',
        companyName: '株式会社山田商事',
      },
      inquiryContent: {
        type: 'billing',
        subject: '請求書の内容確認',
        description: '先月の請求内容について確認したい',
        attachmentUrls: [] as string[],
      },
      receivedDateTime: new Date('2025-01-07T10:30:00Z'),
      userId: 'USER-001',
      deviceContext: {
        deviceType: 'desktop' as const,
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-12345',
      },
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.status).toBe('escalated');
    expect(result.identifiedCustomerId).toBeNull();
    expect(result.escalationReason).toBe('顧客情報が見つかりません。新規顧客として登録が必要です。');
    expect(result.transactionHistory).toBeNull();
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.completedDateTime instanceof Date).toBe(true);
  });
});
