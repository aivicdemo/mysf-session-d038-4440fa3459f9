import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import * as customerDeduplication from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as responseSLA from '../../src/logic/response-time-sla-management';
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement';

jest.mock('../../src/logic/customer-deduplication', () => ({
  ...jest.requireActual<typeof import('../../src/logic/customer-deduplication')>('../../src/logic/customer-deduplication'),
  deduplicateAndIdentifyCustomer: jest.fn(),
}));

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchUserPermissions: jest.fn(),
  fetchCustomerWithRelatedRecords: jest.fn(),
}));

jest.mock('../../src/logic/response-time-sla-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/response-time-sla-management')>('../../src/logic/response-time-sla-management'),
  evaluateAndEscalateInquiryResponseSLA: jest.fn(),
}));

jest.mock('../../src/logic/mobile-security-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mobile-security-enforcement')>('../../src/logic/mobile-security-enforcement'),
  enforceSecurityPolicyForMobileAccess: jest.fn(),
}));

describe('SCEN-054: 顧客が特定されなかった場合、identifiedCustomerId が null で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return escalated status with null identifiedCustomerId when customer not found', async () => {
    const inquiryId = 'INQ-20240115-001';
    const receivedDateTime = new Date('2024-01-15T10:30:00Z');
    const userId = 'USER-0001';

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing',
        complexity: 'low',
      }),
    };

    (customerDeduplication.deduplicateAndIdentifyCustomer as jest.Mock).mockResolvedValue({
      identifiedCustomerId: null,
      isDuplicate: false,
      duplicateCandidates: [],
    });

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      hasPermission: true,
    });

    (responseSLA.evaluateAndEscalateInquiryResponseSLA as jest.Mock).mockResolvedValue({
      complexity: 'low',
      slaExceeded: false,
    });

    (mobileSecurityEnforcement.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue({
      isMobileAccess: false,
      securityPolicyEnforced: false,
    });

    const input = {
      inquiryId,
      inquirerIdentification: {
        name: '田中太郎',
        email: 'tanaka@example.com',
        phoneNumber: '090-1234-5678',
        companyName: '株式会社ABC',
      },
      inquiryContent: {
        type: 'billing',
        subject: '請求書の内容確認',
        description: '先月の請求内容について質問があります',
        attachmentUrls: [],
      },
      receivedDateTime,
      userId,
      deviceContext: {
        deviceType: 'desktop' as const,
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-xyz789',
      },
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.inquiryId).toBe(inquiryId);
    expect(result.identifiedCustomerId).toBeNull();
    expect(result.status).toBe('escalated');
    expect(result.escalationReason).toBe('顧客情報が見つかりません。新規顧客として登録が必要です。');
    expect(result.customerDuplicateCandidates).toEqual([]);
    expect(result.transactionHistory).toBeNull();
    expect(result.notificationSent).toBe(false);
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.completedDateTime.getTime()).toBeGreaterThanOrEqual(receivedDateTime.getTime());
  });
});
