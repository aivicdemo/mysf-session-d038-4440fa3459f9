import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('SCEN-043: 複数の顧客レコードが検出された場合、ステータスが escalated で、統合候補リストが返され、CustomerDuplicateDetected エラーメッセージが返される', () => {
  it('エラー系: 複数顧客が検出された場合、status=escalated でエスカレーションされ、候補リストが返される', async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      deduplicateAndIdentifyCustomer: jest.fn().mockResolvedValue({
        identifiedCustomerId: null,
        customerDuplicateCandidates: [
          {
            customerId: 'CUST-001',
            customerName: '田中太郎（個人事業主）',
            matchScore: 0.92,
          },
          {
            customerId: 'CUST-5847',
            customerName: '田中太郎（ABC商社営業部）',
            matchScore: 0.88,
          },
          {
            customerId: 'CUST-9203',
            customerName: '田中太郎（別会社代理人）',
            matchScore: 0.85,
          },
        ],
      }),
      fetchUserPermissions: jest.fn().mockResolvedValue({
        userId: 'USER-002',
        hasAccess: true,
        accessLevel: 'standard',
      }),
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({
        deviceType: 'desktop',
        restrictionApplied: false,
      }),
      fetchCustomerWithRelatedRecords: jest.fn().mockResolvedValue(null),
      evaluateAndEscalateInquiryResponseSLA: jest.fn().mockResolvedValue({
        complexity: 'low',
        slaMinutes: 240,
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
        email: 'tanaka@example.com',
        phoneNumber: '090-1234-5678',
        companyName: 'ABC商社',
      },
      inquiryContent: {
        type: 'billing',
        subject: '請求書の金額確認',
        description: '2024年12月の請求書に誤りがないか確認したい',
        attachmentUrls: [] as string[],
      },
      receivedDateTime: new Date('2025-01-07T10:30:00Z'),
      userId: 'USER-002',
      deviceContext: {
        deviceType: 'desktop' as const,
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-20250107-001',
      },
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.status).toBe('escalated');
    expect(result.identifiedCustomerId).toBeNull();
    expect(result.customerDuplicateCandidates).toBeDefined();
    expect(result.customerDuplicateCandidates).toHaveLength(3);
    expect(result.customerDuplicateCandidates?.[0]).toEqual({
      customerId: 'CUST-001',
      customerName: '田中太郎（個人事業主）',
      matchScore: 0.92,
    });
    expect(result.customerDuplicateCandidates?.[1]).toEqual({
      customerId: 'CUST-5847',
      customerName: '田中太郎（ABC商社営業部）',
      matchScore: 0.88,
    });
    expect(result.customerDuplicateCandidates?.[2]).toEqual({
      customerId: 'CUST-9203',
      customerName: '田中太郎（別会社代理人）',
      matchScore: 0.85,
    });
    expect(result.transactionHistory).toBeNull();
    expect(result.analysisResult.inquiryType).toBe('billing');
    expect(result.analysisResult.complexity).toBe('low');
    expect(result.notificationSent).toBe(false);
    expect(result.escalationReason).toBe('複数の顧客レコードが検出されました。統合候補を確認して正確な顧客を特定してください。');
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.completedDateTime instanceof Date).toBe(true);
    expect(result.completedDateTime.getTime()).toBeGreaterThanOrEqual(new Date('2025-01-07T10:30:00Z').getTime());
  });
});
