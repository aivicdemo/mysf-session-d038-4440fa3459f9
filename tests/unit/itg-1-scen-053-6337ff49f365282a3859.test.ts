import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

jest.mock('../../src/logic/response-time-sla-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/response-time-sla-management')>('../../src/logic/response-time-sla-management'),
  evaluateAndEscalateInquiryResponseSLA: jest.fn()
}));

jest.mock('../../src/logic/customer-deduplication', () => ({
  ...jest.requireActual<typeof import('../../src/logic/customer-deduplication')>('../../src/logic/customer-deduplication'),
  deduplicateAndIdentifyCustomer: jest.fn()
}));

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchUserPermissions: jest.fn(),
  fetchCustomerWithRelatedRecords: jest.fn()
}));

jest.mock('../../src/logic/mobile-security-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mobile-security-enforcement')>('../../src/logic/mobile-security-enforcement'),
  enforceSecurityPolicyForMobileAccess: jest.fn()
}));

jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  notifyIssueResponse: jest.fn()
}));

import * as responseTimeSlaManagement from '../../src/logic/response-time-sla-management';
import * as customerDeduplication from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement';
import * as notificationService from '../../src/logic/notification-service';

describe('SCEN-053: 顧客が特定された場合、identifiedCustomerId に顧客 ID が設定される', () => {
  let mockAiClient: Tx7Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing_inquiry',
        complexity: 'low',
        rootCause: '月次の請求額変動',
        suggestedResolution: '前月との請求内容の比較と差額理由の説明'
      }),
      identifyCustomer: jest.fn().mockResolvedValue({
        customerId: 'CUST-20230045',
        customerName: '株式会社サンプル'
      }),
      fetchHistory: jest.fn().mockResolvedValue({
        customerId: 'CUST-20230045',
        deals: [{
          dealId: 'DEAL-20240010',
          dealName: '年間保守契約',
          amount: 500000,
          stage: 'closed_won',
          date: new Date('2024-01-10T00:00:00Z')
        }],
        invoices: [{
          invoiceId: 'INV-20240012',
          invoiceNumber: 'INV-2024-001',
          amount: 500000,
          status: 'issued',
          date: new Date('2024-01-12T00:00:00Z')
        }],
        activities: [{
          activityId: 'ACT-20240056',
          type: 'email',
          date: new Date('2024-01-14T15:00:00Z'),
          content: '請求書発行案内メール送信'
        }]
      }),
      generateResponse: jest.fn().mockResolvedValue({
        message: '先月の請求額との差異についてご説明します。本月は年間保守契約に基づいた正規の請求額です。',
        actionItems: [],
        nextSteps: '不明な点がございましたら、お気軽にお問い合わせください。'
      })
    };

    (responseTimeSlaManagement.evaluateAndEscalateInquiryResponseSLA as jest.Mock).mockResolvedValue({
      complexity: 'low'
    });

    (customerDeduplication.deduplicateAndIdentifyCustomer as jest.Mock).mockResolvedValue({
      identified: true,
      customerId: 'CUST-20230045',
      customerName: '株式会社サンプル'
    });

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId: 'CUST-20230045',
      deals: [{
        dealId: 'DEAL-20240010',
        dealName: '年間保守契約',
        amount: 500000,
        stage: 'closed_won',
        date: new Date('2024-01-10T00:00:00Z')
      }],
      invoices: [{
        invoiceId: 'INV-20240012',
        invoiceNumber: 'INV-2024-001',
        amount: 500000,
        status: 'issued',
        date: new Date('2024-01-12T00:00:00Z')
      }],
      activities: [{
        activityId: 'ACT-20240056',
        type: 'email',
        date: new Date('2024-01-14T15:00:00Z'),
        content: '請求書発行案内メール送信'
      }]
    });

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      userId: 'USR-20240001'
    });

    (mobileSecurityEnforcement.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue({
      deviceType: 'desktop'
    });

    (notificationService.notifyIssueResponse as jest.Mock).mockResolvedValue({
      notificationSent: true,
      notificationMethod: 'email'
    });
  });

  test('顧客が特定された場合、identifiedCustomerId に顧客 ID が設定されること', async () => {
    const input = {
      inquiryId: 'INQ-20240115-001',
      inquirerIdentification: {
        name: '山田太郎',
        email: 'yamada.taro@example.com',
        phoneNumber: '090-1234-5678',
        companyName: '株式会社サンプル'
      },
      inquiryContent: {
        type: 'billing_inquiry',
        subject: '先月の請求額について',
        description: '先月の請求書に記載されている金額が前月と異なるため、内容の確認をお願いします。',
        attachmentUrls: []
      },
      receivedDateTime: new Date('2024-01-15T10:30:00Z'),
      userId: 'USR-20240001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-ABC123'
      }
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.inquiryId).toBe('INQ-20240115-001');
    expect(result.status).toBe('completed');
    expect(result.identifiedCustomerId).toBe('CUST-20230045');
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory?.deals).toHaveLength(1);
    expect(result.transactionHistory?.deals[0].dealId).toBe('DEAL-20240010');
    expect(result.transactionHistory?.invoices).toHaveLength(1);
    expect(result.transactionHistory?.invoices[0].invoiceId).toBe('INV-20240012');
    expect(result.transactionHistory?.activities).toHaveLength(1);
    expect(result.analysisResult.complexity).toBe('low');
    expect(result.analysisResult.inquiryType).toBe('billing_inquiry');
    expect(result.responseContent).toBeDefined();
    expect(result.responseContent?.message).toBeDefined();
    expect(result.notificationSent).toBe(true);
    expect(result.escalationReason).toBeNull();
    expect(result.escalatedToUserId).toBeNull();
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.processingTimeMs).toBeLessThanOrEqual(5000);
    expect(result.completedDateTime).toBeDefined();

    expect(responseTimeSlaManagement.evaluateAndEscalateInquiryResponseSLA).toHaveBeenCalled();
    expect(customerDeduplication.deduplicateAndIdentifyCustomer).toHaveBeenCalled();
    expect(dataPersistence.fetchCustomerWithRelatedRecords).toHaveBeenCalled();
    expect(dataPersistence.fetchUserPermissions).toHaveBeenCalled();
    expect(mobileSecurityEnforcement.enforceSecurityPolicyForMobileAccess).toHaveBeenCalled();
    expect(notificationService.notifyIssueResponse).toHaveBeenCalled();
  });
});
