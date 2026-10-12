import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('SCEN-041: 正常な問い合わせが入力された場合、顧客が特定され、履歴が取得され、内容が分析され、回答が生成されて通知が送信され、ステータスが completed で完了する', () => {
  it('正常系: 顧客が特定でき、履歴が取得でき、内容が分析でき、回答が生成され、通知が送信される', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      deduplicateAndIdentifyCustomer: jest.fn().mockResolvedValue({
        identifiedCustomerId: 'CUST-20230501-001',
        customerDuplicateCandidates: [],
      }),
      fetchUserPermissions: jest.fn().mockResolvedValue({
        userId: 'USR-RECEPTION-001',
        permissionLevel: 'standard',
        accessAllowed: true,
      }),
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({
        deviceType: 'desktop',
        restrictionApplied: false,
      }),
      fetchCustomerWithRelatedRecords: jest.fn().mockResolvedValue({
        deals: [
          {
            dealId: 'DEAL-20241201-001',
            dealName: '2024年12月契約サービス提供',
            amount: 500000,
            stage: 'closed_won',
            date: new Date('2024-12-01T00:00:00Z'),
          },
        ],
        invoices: [
          {
            invoiceId: 'INV-20250105-001',
            invoiceNumber: 'INV-2024-1201',
            amount: 550000,
            status: 'issued',
            date: new Date('2025-01-05T00:00:00Z'),
          },
        ],
        activities: [
          {
            activityId: 'ACT-20241220-001',
            type: 'call',
            date: new Date('2024-12-20T14:00:00Z'),
            content: '契約内容の最終確認',
          },
        ],
      }),
      evaluateAndEscalateInquiryResponseSLA: jest.fn().mockResolvedValue({
        complexity: 'medium',
        requiresEscalation: false,
      }),
      notifyIssueResponse: jest.fn().mockResolvedValue({
        notificationSent: true,
        notificationMethod: 'email',
        recipientEmail: 'yamada.taro@example.com',
      }),
      recordUserOperation: jest.fn().mockResolvedValue({
        operationId: 'OP-001',
        recordedAt: new Date(),
      }),
    };

    const input = {
      inquiryId: 'INQ-20250107-001',
      inquirerIdentification: {
        name: '山田太郎',
        email: 'yamada.taro@example.com',
        phoneNumber: '09012345678',
        companyName: '株式会社ABC',
      },
      inquiryContent: {
        type: 'billing',
        subject: '請求書の金額について',
        description:
          '2024年12月分の請求書に記載された金額が前月比で大幅に増加しているため、内容の確認をお願いしたい。',
        attachmentUrls: [] as string[],
      },
      receivedDateTime: new Date('2025-01-07T10:30:00Z'),
      userId: 'USR-RECEPTION-001',
      deviceContext: {
        deviceType: 'desktop' as const,
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-20250107-ABC123',
      },
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.status).toBe('completed');
    expect(result.identifiedCustomerId).toBe('CUST-20230501-001');
    expect(result.customerDuplicateCandidates).toBeUndefined();
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory?.deals).toHaveLength(1);
    expect(result.transactionHistory?.deals[0].dealId).toBe('DEAL-20241201-001');
    expect(result.transactionHistory?.invoices).toHaveLength(1);
    expect(result.transactionHistory?.invoices[0].invoiceId).toBe('INV-20250105-001');
    expect(result.transactionHistory?.activities).toHaveLength(1);
    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.inquiryType).toBe('billing_inquiry');
    expect(result.analysisResult.complexity).toBe('medium');
    expect(result.analysisResult.rootCause).toBe('契約金額と請求金額の不一致');
    expect(result.analysisResult.suggestedResolution).toBe('請求明細を確認し、金額差の理由を説明する');
    expect(result.responseContent).toBeDefined();
    expect(result.responseContent?.message).toContain('平素はご利用いただきありがとうございます');
    expect(result.notificationSent).toBe(true);
    expect(result.escalationReason).toBeNull();
    expect(result.escalatedToUserId).toBeNull();
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(2500);
    expect(result.processingTimeMs).toBeLessThanOrEqual(4500);
    expect(result.completedDateTime.getTime()).toBeGreaterThan(new Date('2025-01-07T10:30:00Z').getTime());
  });
});
