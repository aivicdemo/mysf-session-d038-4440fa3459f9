import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import * as customerDeduplication from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as responseSlaManagement from '../../src/logic/response-time-sla-management';
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement';
import * as accessControlEnforcement from '../../src/logic/access-control-enforcement';
import * as notificationService from '../../src/logic/notification-service';
import * as auditLogging from '../../src/logic/audit-logging';

describe('SCEN-048: Notification Failed - Error Response', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failed status when notification sending fails', async () => {
    const inquiryId = 'INQ-20250107-001';
    const inquirerIdentification = {
      name: '山田太郎',
      email: 'yamada.taro@example.com',
      phoneNumber: '09012345678',
      companyName: '株式会社ABC',
    };
    const inquiryContent = {
      type: 'billing_inquiry',
      subject: '請求書の確認',
      description: '2025年1月分の請求書について内容を確認したい',
      attachmentUrls: [],
    };
    const receivedDateTime = new Date('2025-01-07T10:00:00Z');
    const userId = 'USER-001';
    const deviceContext = {
      deviceType: 'desktop' as const,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-12345',
    };

    jest.spyOn(customerDeduplication, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-00789',
        customerName: '株式会社ABC',
      },
      deduplicationCandidates: [],
    });

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:00:00Z',
    });

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
      restrictedFields: [],
      allowedFields: [],
      securityControlsApplied: {
        screenshotPreventionEnabled: false,
        sessionTimeoutMinutes: 30,
        sessionTimeoutAppliedAt: new Date('2025-01-07T10:00:00Z'),
        sessionTimeoutSeconds: 1800,
      },
      displayPolicy: {
        policyType: 'full_access',
        description: 'Desktop user - full access',
      },
    });

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customer: {
        customerId: 'CUST-00789',
        customerName: '株式会社ABC',
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
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      },
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'CUST-00789',
          salesRepresentativeId: 'SR-001',
          dealName: '契約A',
          dealAmount: 500000,
          stageId: 'stage-closed',
          expectedContractDate: '2025-01-01',
          contractedDate: '2025-01-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'INV-001',
            dealId: 'DEAL-001',
            customerId: 'CUST-00789',
            salesRepresentativeId: 'SR-001',
            invoiceNumber: 'INV-2025-001',
            invoiceDate: '2025-01-05',
            dueDate: '2025-02-05',
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
            createdAt: '2025-01-05T00:00:00Z',
            updatedAt: '2025-01-05T00:00:00Z',
            createdBy: 'SYSTEM',
          },
          lineItems: [],
        },
      ],
      activities: [
        {
          activityId: 'ACT-001',
          customerId: 'CUST-00789',
          salesRepresentativeId: 'SR-001',
          activityType: 'email',
          activityDateTime: '2025-01-06T00:00:00Z',
          activityContent: '請求書送付',
          nextFollowUpScheduledDate: null,
          dealId: 'DEAL-001',
          estimatedAmount: null,
          contractedFlag: true,
          activityDurationMinutes: 5,
          activityCount: 1,
          activityFrequency: 'occasional',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2025-01-06T00:00:00Z',
          updatedAt: '2025-01-06T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      fetchedAt: '2025-01-07T10:00:00Z',
    });

    jest.spyOn(responseSlaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({
      inquiryId: 'INQ-20250107-001',
      complexityLevel: 'low',
      slaDeadlineDateTime: new Date('2025-01-07T11:00:00Z'),
      isEscalationRequired: false,
      escalationTargetSupervisorId: null,
      escalationNotificationSent: false,
    });

    jest.spyOn(accessControlEnforcement, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: ['SR-001'],
        visibleCustomerIds: ['CUST-00789'],
        visibleDealIds: ['DEAL-001'],
        visibleInvoiceIds: ['INV-001'],
        visibleActivityIds: ['ACT-001'],
      },
      fieldMaskingRules: [],
      operationPermissions: [
        { operationType: 'read', permitted: true },
        { operationType: 'write', permitted: true },
      ],
    });

    jest.spyOn(notificationService, 'notifyIssueResponse').mockResolvedValue({
      notificationId: 'NOTIF-001',
      recipientCount: 0,
      sentChannels: [],
      sentRecipients: [],
      failedRecipients: [
        {
          userId: 'USER-001',
          userName: '山田太郎',
          reason: 'メール送信サービスに接続できません',
        },
      ],
      failedChannels: ['email'],
      responseNotificationId: 'RESPNOTIF-001',
    });

    jest.spyOn(auditLogging, 'recordUserOperation').mockResolvedValue({
      operationLogId: 'LOG-001',
      userId: 'USER-001',
      operationType: 'read',
      targetTableName: 'inquiry',
      targetRecordId: 'INQ-20250107-001',
      recordedAt: new Date('2025-01-07T10:00:00Z'),
    });

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing_inquiry',
        complexity: 'low',
        suggestedResolution: '請求書内容の確認と説明',
      }),
      generateResponse: jest.fn().mockResolvedValue({
        message: '請求書の内容は以下の通りです。ご不明な点があればお答えします。',
        actionItems: ['請求書内容の説明'],
        nextSteps: 'ご質問があればお知らせください',
      }),
    };

    const input = {
      inquiryId,
      inquirerIdentification,
      inquiryContent,
      receivedDateTime,
      userId,
      deviceContext,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('failed');
    expect(result.notificationSent).toBe(false);
    expect(result.identifiedCustomerId).toBe('CUST-00789');
    expect(result.analysisResult.inquiryType).toBe('billing_inquiry');
    expect(result.analysisResult.complexity).toBe('low');
    expect(result.errorDetails).toEqual({
      errorName: 'NotificationFailed',
      errorMessage: '回答の通知送信に失敗しました。手動で顧客に連絡してください。',
    });
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.completedDateTime).toBeInstanceOf(Date);
  });

  it('should contain transaction history even when notification fails', async () => {
    const inquiryId = 'INQ-20250107-001';
    const inquirerIdentification = {
      name: '山田太郎',
      email: 'yamada.taro@example.com',
      phoneNumber: '09012345678',
      companyName: '株式会社ABC',
    };
    const inquiryContent = {
      type: 'billing_inquiry',
      subject: '請求書の確認',
      description: '2025年1月分の請求書について内容を確認したい',
      attachmentUrls: [],
    };
    const receivedDateTime = new Date('2025-01-07T10:00:00Z');
    const userId = 'USER-001';
    const deviceContext = {
      deviceType: 'desktop' as const,
      ipAddress: '192.168.1.100',
      sessionId: 'SESSION-12345',
    };

    jest.spyOn(customerDeduplication, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-00789',
        customerName: '株式会社ABC',
      },
      deduplicationCandidates: [],
    });

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:00:00Z',
    });

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
      restrictedFields: [],
      allowedFields: [],
      securityControlsApplied: {
        screenshotPreventionEnabled: false,
        sessionTimeoutMinutes: 30,
        sessionTimeoutAppliedAt: new Date('2025-01-07T10:00:00Z'),
        sessionTimeoutSeconds: 1800,
      },
      displayPolicy: {
        policyType: 'full_access',
        description: 'Desktop user - full access',
      },
    });

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customer: {
        customerId: 'CUST-00789',
        customerName: '株式会社ABC',
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
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      },
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'CUST-00789',
          salesRepresentativeId: 'SR-001',
          dealName: '契約A',
          dealAmount: 500000,
          stageId: 'stage-closed',
          expectedContractDate: '2025-01-01',
          contractedDate: '2025-01-01',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'INV-001',
            dealId: 'DEAL-001',
            customerId: 'CUST-00789',
            salesRepresentativeId: 'SR-001',
            invoiceNumber: 'INV-2025-001',
            invoiceDate: '2025-01-05',
            dueDate: '2025-02-05',
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
            createdAt: '2025-01-05T00:00:00Z',
            updatedAt: '2025-01-05T00:00:00Z',
            createdBy: 'SYSTEM',
          },
          lineItems: [],
        },
      ],
      activities: [
        {
          activityId: 'ACT-001',
          customerId: 'CUST-00789',
          salesRepresentativeId: 'SR-001',
          activityType: 'email',
          activityDateTime: '2025-01-06T00:00:00Z',
          activityContent: '請求書送付',
          nextFollowUpScheduledDate: null,
          dealId: 'DEAL-001',
          estimatedAmount: null,
          contractedFlag: true,
          activityDurationMinutes: 5,
          activityCount: 1,
          activityFrequency: 'occasional',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2025-01-06T00:00:00Z',
          updatedAt: '2025-01-06T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      fetchedAt: '2025-01-07T10:00:00Z',
    });

    jest.spyOn(responseSlaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({
      inquiryId: 'INQ-20250107-001',
      complexityLevel: 'low',
      slaDeadlineDateTime: new Date('2025-01-07T11:00:00Z'),
      isEscalationRequired: false,
      escalationTargetSupervisorId: null,
      escalationNotificationSent: false,
    });

    jest.spyOn(accessControlEnforcement, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: ['SR-001'],
        visibleCustomerIds: ['CUST-00789'],
        visibleDealIds: ['DEAL-001'],
        visibleInvoiceIds: ['INV-001'],
        visibleActivityIds: ['ACT-001'],
      },
      fieldMaskingRules: [],
      operationPermissions: [
        { operationType: 'read', permitted: true },
        { operationType: 'write', permitted: true },
      ],
    });

    jest.spyOn(notificationService, 'notifyIssueResponse').mockResolvedValue({
      notificationId: 'NOTIF-001',
      recipientCount: 0,
      sentChannels: [],
      sentRecipients: [],
      failedRecipients: [
        {
          userId: 'USER-001',
          userName: '山田太郎',
          reason: 'メール送信サービスに接続できません',
        },
      ],
      failedChannels: ['email'],
      responseNotificationId: 'RESPNOTIF-001',
    });

    jest.spyOn(auditLogging, 'recordUserOperation').mockResolvedValue({
      operationLogId: 'LOG-001',
      userId: 'USER-001',
      operationType: 'read',
      targetTableName: 'inquiry',
      targetRecordId: 'INQ-20250107-001',
      recordedAt: new Date('2025-01-07T10:00:00Z'),
    });

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing_inquiry',
        complexity: 'low',
        suggestedResolution: '請求書内容の確認と説明',
      }),
      generateResponse: jest.fn().mockResolvedValue({
        message: '請求書の内容は以下の通りです。ご不明な点があればお答えします。',
        actionItems: ['請求書内容の説明'],
        nextSteps: 'ご質問があればお知らせください',
      }),
    };

    const input = {
      inquiryId,
      inquirerIdentification,
      inquiryContent,
      receivedDateTime,
      userId,
      deviceContext,
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.transactionHistory).toBeDefined();
    if (result.transactionHistory) {
      expect(result.transactionHistory.deals).toHaveLength(1);
      expect(result.transactionHistory.deals[0].dealId).toBe('DEAL-001');
      expect(result.transactionHistory.deals[0].dealName).toBe('契約A');
      expect(result.transactionHistory.invoices).toHaveLength(1);
      expect(result.transactionHistory.invoices[0].invoiceNumber).toBe('INV-2025-001');
      expect(result.transactionHistory.activities).toHaveLength(1);
      expect(result.transactionHistory.activities[0].activityId).toBe('ACT-001');
    }
  });
});
