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

describe('SCEN-056: 処理がエスカレーションまたは失敗した場合、escalationReason または errorDetails が設定される', () => {
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

  it('should escalate when ResponseSLAExceeded condition is met', async () => {
    const inquiryId = 'INQ-20250107-001';
    const customerId = 'CUST-12345';
    const userId = 'USER-001';
    const escalationUserId = 'SUPERVISOR-001';

    const input: Tx7Imp1AgentInput = {
      inquiryId,
      inquirerIdentification: {
        name: '山田太郎',
        email: 'yamada.taro@example.com',
        phoneNumber: '09012345678',
        companyName: '株式会社サンプル',
      },
      inquiryContent: {
        type: 'billing',
        subject: '請求書の確認',
        description: '先月の請求明細について質問があります。',
        attachmentUrls: [],
      },
      receivedDateTime: new Date('2025-01-07T10:00:00Z'),
      userId,
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        sessionId: 'SESSION-20250107-ABC123',
      },
    };

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn<() => Promise<any>>().mockResolvedValue({
        inquiryType: 'billing',
        complexity: 'low',
        suggestedResolution: '請求書の金額確認と回答を提供します。',
      }),
    };

    mockCustomerDeduplication.deduplicateAndIdentifyCustomer.mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId,
        customerName: '株式会社サンプル',
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
        customerName: '株式会社サンプル',
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
          dealId: 'DEAL-001',
          customerId,
          salesRepresentativeId: userId,
          dealName: '2024年契約更新',
          dealAmount: 500000,
          stageId: 'stage-closed-won',
          expectedContractDate: '2024-12-01',
          contractedDate: '2024-12-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-12-01T00:00:00Z',
          updatedAt: '2024-12-01T00:00:00Z',
          createdBy: userId,
        },
      ],
      activities: [
        {
          activityId: 'ACT-001',
          customerId,
          salesRepresentativeId: userId,
          activityType: 'call',
          activityResult: 'completed',
          activityFrequency: 'once',
          activityContent: '契約内容確認完了',
          activityDateTime: '2024-12-10T00:00:00Z',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 0,
          activityCount: 1,
          nextAction: null,
          createdAt: '2024-12-10T00:00:00Z',
          updatedAt: '2024-12-10T00:00:00Z',
          createdBy: userId,
        },
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'INV-001',
            dealId: 'DEAL-001',
            customerId,
            salesRepresentativeId: userId,
            invoiceNumber: 'INV-2024-12-001',
            invoiceDate: '2024-12-05',
            dueDate: '2024-12-31',
            invoiceAmount: 500000,
            taxAmount: 50000,
            untaxedAmount: 450000,
            invoiceStatus: 'issued',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: 'verified',
            referenceIntegrityVerificationStatus: 'verified',
            createdAt: '2024-12-05T00:00:00Z',
            updatedAt: '2024-12-05T00:00:00Z',
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
      slaDeadlineDateTime: new Date('2025-01-07T10:10:00Z'),
      isEscalationRequired: true,
      escalationTargetSupervisorId: escalationUserId,
      escalationNotificationSent: true,
    });

    mockAuditLogging.recordUserOperation.mockResolvedValue({
      operationLogId: 'LOG-20250107-002',
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
    expect(result.status).toBe('escalated');
    expect(result.identifiedCustomerId).toBe(customerId);
    expect(result.escalationReason).toBe('ResponseSLAExceeded');
    expect(result.escalatedToUserId).toBe(escalationUserId);
    expect(result.errorDetails).toBeNull();
    expect(result.analysisResult.complexity).toBe('low');
    expect(result.transactionHistory).toBeDefined();
    expect(result.transactionHistory?.deals).toBeDefined();
    expect(result.transactionHistory?.invoices).toBeDefined();
    expect(result.transactionHistory?.activities).toBeDefined();
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.processingTimeMs).toBeLessThanOrEqual(endTime - startTime + 100);
    expect(result.completedDateTime).toBeInstanceOf(Date);
    expect(result.completedDateTime.getTime()).toBeGreaterThanOrEqual(input.receivedDateTime.getTime());
    expect(result.notificationSent).toEqual(expect.any(Boolean));

    expect(mockCustomerDeduplication.deduplicateAndIdentifyCustomer).toHaveBeenCalled();
    expect(mockDataPersistence.fetchUserPermissions).toHaveBeenCalled();
    expect(mockDataPersistence.fetchCustomerWithRelatedRecords).toHaveBeenCalled();
    expect(mockResponseSLA.evaluateAndEscalateInquiryResponseSLA).toHaveBeenCalled();
    expect(mockAuditLogging.recordUserOperation).toHaveBeenCalled();
  });
});
