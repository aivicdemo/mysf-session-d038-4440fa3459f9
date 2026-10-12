import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Tx7Imp1AgentInput, Tx7Imp1AgentOutput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as customerDeduplication from '../../src/logic/customer-deduplication';
import * as responseSLA from '../../src/logic/response-time-sla-management';
import * as notificationService from '../../src/logic/notification-service';
import * as auditLogging from '../../src/logic/audit-logging';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as mobileSecurity from '../../src/logic/mobile-security-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/customer-deduplication');
jest.mock('../../src/logic/response-time-sla-management');
jest.mock('../../src/logic/notification-service');
jest.mock('../../src/logic/audit-logging');
jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/mobile-security-enforcement');

describe('SCEN-055: 処理が正常に完了した場合、notificationSent が true で、responseContent に回答メッセージとアクションアイテムが含まれる', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;
  const mockCustomerDeduplication = customerDeduplication as jest.Mocked<typeof customerDeduplication>;
  const mockResponseSLA = responseSLA as jest.Mocked<typeof responseSLA>;
  const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
  const mockAuditLogging = auditLogging as jest.Mocked<typeof auditLogging>;
  const mockAccessControl = accessControl as jest.Mocked<typeof accessControl>;
  const mockMobileSecurity = mobileSecurity as jest.Mocked<typeof mobileSecurity>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete processing successfully with notification and response content', async () => {
    const inquiryId = 'INQ-20250107-001';
    const customerId = 'CUST-20240515-789';
    const userId = 'USR-20250101-support001';

    const input: Tx7Imp1AgentInput = {
      inquiryId,
      inquirerIdentification: {
        name: '田中太郎',
        email: 'tanaka.taro@example.com',
        phoneNumber: '090-1234-5678',
        companyName: '株式会社Example',
      },
      inquiryContent: {
        type: 'billing',
        subject: '請求書の金額ズレについて',
        description: '2024年12月分の請求書で金額が異なっています。確認をお願いします。',
        attachmentUrls: ['https://s3.example.com/invoice-2024-12.pdf'],
      },
      receivedDateTime: new Date('2025-01-07T10:30:00Z'),
      userId,
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '203.0.113.50',
        sessionId: 'sess-abc123def456',
      },
    };

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn<() => Promise<any>>().mockResolvedValue({
        inquiryType: 'billing',
        complexity: 'low',
        suggestedResolution: '請求書の金額ズレを確認し、修正済み請求書を再送信します。',
      }),
      generateResponse: jest.fn<() => Promise<any>>().mockResolvedValue({
        message: '平素よりお世話になっております。田中太郎様へのお問い合わせ対応をさせていただきます。',
        actionItems: ['請求書の金額ズレを確認', '修正済み請求書を再送信', '確認メールを送付'],
        nextSteps: '本件については3営業日以内に対応いたします。',
      }),
    };

    mockCustomerDeduplication.deduplicateAndIdentifyCustomer.mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId,
        customerName: '株式会社Example',
      },
      deduplicationCandidates: [],
    });

    mockDataPersistence.fetchUserPermissions.mockResolvedValue({
      permissions: [
        {
          permissionId: 'PERM-001',
          userId,
          permissionCode: 'VIEW_CUSTOMER_DATA',
          permissionName: '顧客データ閲覧',
          description: '顧客データの閲覧権限',
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    mockAccessControl.enforceAccessControlForDataDisplay.mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [userId],
        visibleCustomerIds: [customerId],
        visibleDealIds: [],
        visibleInvoiceIds: [],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [
        {
          operationType: 'read',
          permitted: true,
        },
      ],
    });

    mockMobileSecurity.enforceSecurityPolicyForMobileAccess.mockResolvedValue({
      isMobileAccess: false,
      restrictedFields: [],
      allowedFields: [],
      securityControlsApplied: {
        screenshotPreventionEnabled: false,
        sessionTimeoutMinutes: 60,
        sessionTimeoutAppliedAt: new Date(),
      },
      displayPolicy: {
        policyType: 'full_access',
        description: 'Desktop access - full access',
      },
    });

    mockDataPersistence.fetchCustomerWithRelatedRecords.mockResolvedValue({
      customer: {
        customerId,
        customerName: '株式会社Example',
        customerNameKana: null,
        customerCategory: null,
        postalCode: null,
        address: null,
        phoneNumber: null,
        emailAddress: null,
        contactPersonName: null,
        paymentTerms: null,
        invoiceAddress: null,
        invoiceEmailAddress: null,
        status: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      deals: [
        {
          dealId: 'DEAL-20240801-001',
          customerId,
          salesRepresentativeId: userId,
          dealName: '年間保守契約更新',
          dealAmount: 500000,
          stageId: 'stage-closed-won',
          expectedContractDate: '2024-08-15',
          contractedDate: '2024-08-15',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-08-01T00:00:00Z',
          updatedAt: '2024-08-15T00:00:00Z',
          createdBy: userId,
        },
      ],
      activities: [
        {
          activityId: 'ACT-20241220-001',
          customerId,
          salesRepresentativeId: userId,
          activityType: 'email',
          activityResult: 'completed',
          activityFrequency: 'once',
          activityContent: '請求書発送確認メール',
          activityDateTime: '2024-12-20T00:00:00Z',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 0,
          activityCount: 1,
          nextAction: null,
          createdAt: '2024-12-20T00:00:00Z',
          updatedAt: '2024-12-20T00:00:00Z',
          createdBy: userId,
        },
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'INV-20241201-001',
            dealId: 'DEAL-20240801-001',
            customerId,
            salesRepresentativeId: userId,
            invoiceNumber: 'INV-2024-1201-001',
            invoiceDate: '2024-12-01',
            dueDate: '2024-12-31',
            invoiceAmount: 450000,
            taxAmount: 45000,
            untaxedAmount: 405000,
            invoiceStatus: 'sent',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2024-12-01T00:00:00Z',
            updatedAt: '2024-12-01T00:00:00Z',
            createdBy: userId,
          },
          lineItems: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
    } as any);

    mockResponseSLA.evaluateAndEscalateInquiryResponseSLA.mockResolvedValue({
      inquiryId,
      complexityLevel: 'low',
      slaDeadlineDateTime: new Date('2025-01-08T10:30:00Z'),
      isEscalationRequired: false,
      escalationTargetSupervisorId: null,
      escalationNotificationSent: false,
    });

    mockNotificationService.notifyIssueResponse.mockResolvedValue({
      notificationId: 'NOTIF-20250107-001',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'CUST-20240515-789-user',
          userName: '田中太郎',
          role: 'customer',
          channel: 'email',
          sentAt: new Date('2025-01-07T10:35:00Z'),
        },
      ],
      responseNotificationId: 'NOTIF-20250107-001',
    });

    mockAuditLogging.recordUserOperation.mockResolvedValue({
      operationLogId: 'LOG-20250107-001',
      userId,
      operationType: 'read',
      targetTableName: 'inquiry',
      targetRecordId: inquiryId,
      recordedAt: new Date(),
    });

    const startTime = Date.now();
    const result = await runTx7Imp1Agent(input, mockAiClient);
    const endTime = Date.now();

    expect(result).toBeDefined();
    expect(result.inquiryId).toBe(inquiryId);
    expect(result.status).toBe('completed');
    expect(result.identifiedCustomerId).toBe(customerId);
    expect(result.customerDuplicateCandidates).toEqual([]);
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory?.deals[0].dealId).toBe('DEAL-20240801-001');
    expect(result.transactionHistory?.deals[0].dealName).toBe('年間保守契約更新');
    expect(result.transactionHistory?.deals[0].amount).toBe(500000);
    expect(result.transactionHistory?.invoices[0].invoiceId).toBe('INV-20241201-001');
    expect(result.transactionHistory?.invoices[0].invoiceNumber).toBe('INV-2024-1201-001');
    expect(result.transactionHistory?.invoices[0].amount).toBe(450000);
    expect(result.transactionHistory?.invoices[0].status).toBe('sent');
    expect(result.transactionHistory?.activities[0].type).toBe('email');
    expect(result.transactionHistory?.activities[0].content).toBe('請求書発送確認メール');
    expect(result.analysisResult.inquiryType).toBe('billing');
    expect(result.analysisResult.complexity).toBe('low');
    expect(result.analysisResult.suggestedResolution).toBeDefined();
    expect(result.responseContent).toBeDefined();
    expect(result.responseContent?.message).toBeDefined();
    expect(result.responseContent?.actionItems).toBeDefined();
    expect(result.responseContent?.actionItems).toContain('請求書の金額ズレを確認');
    expect(result.responseContent?.actionItems).toContain('修正済み請求書を再送信');
    expect(result.responseContent?.actionItems).toContain('確認メールを送付');
    expect(result.responseContent?.nextSteps).toBeDefined();
    expect(result.notificationSent).toBe(true);
    expect(result.escalationReason).toBeNull();
    expect(result.escalatedToUserId).toBeNull();
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.processingTimeMs).toBeLessThanOrEqual(endTime - startTime + 100);
    expect(result.completedDateTime).toBeInstanceOf(Date);
    expect(result.completedDateTime.getTime()).toBeGreaterThanOrEqual(input.receivedDateTime.getTime());

    expect(mockCustomerDeduplication.deduplicateAndIdentifyCustomer).toHaveBeenCalled();
    expect(mockDataPersistence.fetchUserPermissions).toHaveBeenCalled();
    expect(mockAccessControl.enforceAccessControlForDataDisplay).toHaveBeenCalled();
    expect(mockMobileSecurity.enforceSecurityPolicyForMobileAccess).toHaveBeenCalled();
    expect(mockDataPersistence.fetchCustomerWithRelatedRecords).toHaveBeenCalled();
    expect(mockResponseSLA.evaluateAndEscalateInquiryResponseSLA).toHaveBeenCalled();
    expect(mockNotificationService.notifyIssueResponse).toHaveBeenCalled();
    expect(mockAuditLogging.recordUserOperation).toHaveBeenCalled();
  });
});
