import { runTx7Imp1Agent, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';
import * as customerDeduplication from '../../src/logic/customer-deduplication';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as responseSlaManagement from '../../src/logic/response-time-sla-management';
import * as mobileSecurityEnforcement from '../../src/logic/mobile-security-enforcement';
import * as accessControlEnforcement from '../../src/logic/access-control-enforcement';
import * as auditLogging from '../../src/logic/audit-logging';

describe('SCEN-045: Inquiry SLA Exceeded - Escalation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should escalate when response time SLA is exceeded for high complexity inquiry', async () => {
    const inquiryId = 'INQ-20250107-001';
    const inquirerIdentification = {
      name: '山田太郎',
      email: 'yamada@example.com',
      phoneNumber: '09012345678',
      companyName: '株式会社ABC',
    };
    const inquiryContent = {
      type: 'billing_issue',
      subject: '請求書の金額に関する問題',
      description:
        '2024年12月の請求書の金額が異なっているようです。前月比で150%増加しており、詳細な内訳の確認が必要です。複数の商談との関連性も不明です。',
      attachmentUrls: ['https://example.com/invoice_dec2024.pdf'],
    };
    const receivedDateTime = new Date('2025-01-07T09:00:00Z');
    const userId = 'USR-20250107-SA001';
    const deviceContext = {
      deviceType: 'desktop' as const,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123def456',
    };

    // Mock preconditions with correct output types
    jest.spyOn(responseSlaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({
      inquiryId: 'INQ-20250107-001',
      complexityLevel: 'high',
      slaDeadlineDateTime: new Date('2025-01-07T09:30:00Z'),
      isEscalationRequired: true,
      escalationTargetSupervisorId: 'SUP-001',
      escalationNotificationSent: true,
    });

    jest.spyOn(customerDeduplication, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-20250107-001',
        customerName: '株式会社ABC',
      },
      deduplicationCandidates: [],
    });

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customer: {
        customerId: 'CUST-20250107-001',
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
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      },
      deals: [
        {
          dealId: 'DEAL-20250101-001',
          customerId: 'CUST-20250107-001',
          salesRepresentativeId: 'SR-001',
          dealName: 'システム構築プロジェクト',
          dealAmount: 5000000,
          stageId: 'stage-closed',
          expectedContractDate: '2024-12-15',
          contractedDate: '2024-12-15',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-12-15T00:00:00Z',
          updatedAt: '2024-12-15T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      invoices: [
        {
          invoice: {
            invoiceId: 'INV-20241201-001',
            dealId: 'DEAL-20250101-001',
            customerId: 'CUST-20250107-001',
            salesRepresentativeId: 'SR-001',
            invoiceNumber: 'INV-2024-12-001',
            invoiceDate: '2024-12-01',
            dueDate: '2024-12-31',
            invoiceAmount: 2500000,
            taxAmount: 250000,
            untaxedAmount: 2250000,
            invoiceStatus: 'issued',
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
            createdBy: 'SYSTEM',
          },
          lineItems: [],
        },
      ],
      activities: [
        {
          activityId: 'ACT-20241215-001',
          customerId: 'CUST-20250107-001',
          salesRepresentativeId: 'SR-001',
          activityType: 'email',
          activityDateTime: '2024-12-15T14:30:00Z',
          activityContent: '請求書第1期分を送付',
          nextFollowUpScheduledDate: null,
          dealId: 'DEAL-20250101-001',
          estimatedAmount: null,
          contractedFlag: true,
          activityDurationMinutes: 5,
          activityCount: 1,
          activityFrequency: 'occasional',
          activityResult: 'completed',
          nextAction: null,
          createdAt: '2024-12-15T14:30:00Z',
          updatedAt: '2024-12-15T14:30:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      fetchedAt: '2025-01-07T09:00:00Z',
    });

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [
        {
          permissionId: 'PERM-001',
          userId: 'USR-20250107-SA001',
          permissionCode: 'VIEW_CUSTOMER_DATA',
          permissionName: '顧客データ表示',
          description: null,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-07T09:00:00Z',
    });

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
      restrictedFields: [],
      allowedFields: [
        { fieldName: 'customerId', fieldValue: 'CUST-20250107-001' },
        { fieldName: 'customerName', fieldValue: '株式会社ABC' },
        { fieldName: 'phoneNumber', fieldValue: null },
      ],
      securityControlsApplied: {
        screenshotPreventionEnabled: false,
        sessionTimeoutMinutes: 30,
        sessionTimeoutAppliedAt: new Date('2025-01-07T09:00:00Z'),
        sessionTimeoutSeconds: 1800,
      },
      displayPolicy: {
        policyType: 'full_access',
        description: 'Desktop user - full access',
      },
    });

    jest.spyOn(accessControlEnforcement, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: ['SR-001'],
        visibleCustomerIds: ['CUST-20250107-001'],
        visibleDealIds: ['DEAL-20250101-001'],
        visibleInvoiceIds: ['INV-20241201-001'],
        visibleActivityIds: ['ACT-20241215-001'],
      },
      fieldMaskingRules: [],
      operationPermissions: [
        { operationType: 'read', permitted: true },
        { operationType: 'write', permitted: true },
      ],
    });

    jest.spyOn(auditLogging, 'recordUserOperation').mockResolvedValue({
      operationLogId: 'LOG-001',
      userId: 'USR-20250107-SA001',
      operationType: 'read',
      targetTableName: 'inquiry',
      targetRecordId: 'INQ-20250107-001',
      recordedAt: new Date('2025-01-07T09:00:00Z'),
    });

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing_issue',
        complexity: 'high',
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

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.status).toBe('escalated');
    expect(result.identifiedCustomerId).toBe('CUST-20250107-001');
    expect(result.customerDuplicateCandidates).toEqual([]);
    expect(result.notificationSent).toBe(false);
    expect(result.escalationReason).toBe('高複雑度案件の応答時間SLAが超過。管理職への報告が必要。');
    expect(result.errorDetails).toBeNull();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.completedDateTime).toBeInstanceOf(Date);
  });

  it('should return ResponseSLAExceeded error with escalation status', async () => {
    const inquiryId = 'INQ-20250107-001';
    const inquirerIdentification = {
      name: '山田太郎',
      email: 'yamada@example.com',
      phoneNumber: '09012345678',
      companyName: '株式会社ABC',
    };
    const inquiryContent = {
      type: 'billing_issue',
      subject: '請求書の金額に関する問題',
      description:
        '2024年12月の請求書の金額が異なっているようです。前月比で150%増加しており、詳細な内訳の確認が必要です。複数の商談との関連性も不明です。',
      attachmentUrls: ['https://example.com/invoice_dec2024.pdf'],
    };
    const receivedDateTime = new Date('2025-01-07T09:00:00Z');
    const userId = 'USR-20250107-SA001';
    const deviceContext = {
      deviceType: 'desktop' as const,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc123def456',
    };

    jest.spyOn(responseSlaManagement, 'evaluateAndEscalateInquiryResponseSLA').mockResolvedValue({
      inquiryId: 'INQ-20250107-001',
      complexityLevel: 'high',
      slaDeadlineDateTime: new Date('2025-01-07T09:30:00Z'),
      isEscalationRequired: true,
      escalationTargetSupervisorId: 'SUP-001',
      escalationNotificationSent: true,
    });

    jest.spyOn(customerDeduplication, 'deduplicateAndIdentifyCustomer').mockResolvedValue({
      status: 'identified',
      identifiedCustomer: {
        customerId: 'CUST-20250107-001',
        customerName: '株式会社ABC',
      },
      deduplicationCandidates: [],
    });

    jest.spyOn(dataPersistence, 'fetchCustomerWithRelatedRecords').mockResolvedValue({
      customer: {
        customerId: 'CUST-20250107-001',
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
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      },
      deals: [],
      invoices: [],
      activities: [],
      fetchedAt: '2025-01-07T09:00:00Z',
    });

    jest.spyOn(dataPersistence, 'fetchUserPermissions').mockResolvedValue({
      permissions: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T09:00:00Z',
    });

    jest.spyOn(mobileSecurityEnforcement, 'enforceSecurityPolicyForMobileAccess').mockResolvedValue({
      isMobileAccess: false,
      restrictedFields: [],
      allowedFields: [],
      securityControlsApplied: {
        screenshotPreventionEnabled: false,
        sessionTimeoutMinutes: 30,
        sessionTimeoutAppliedAt: new Date('2025-01-07T09:00:00Z'),
        sessionTimeoutSeconds: 1800,
      },
      displayPolicy: {
        policyType: 'full_access',
        description: 'Desktop user - full access',
      },
    });

    jest.spyOn(accessControlEnforcement, 'enforceAccessControlForDataDisplay').mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {
        visibleRepresentativeIds: [],
        visibleCustomerIds: [],
        visibleDealIds: [],
        visibleInvoiceIds: [],
        visibleActivityIds: [],
      },
      fieldMaskingRules: [],
      operationPermissions: [
        { operationType: 'read', permitted: true },
        { operationType: 'write', permitted: true },
      ],
    });

    jest.spyOn(auditLogging, 'recordUserOperation').mockResolvedValue({
      operationLogId: 'LOG-001',
      userId: 'USR-20250107-SA001',
      operationType: 'read',
      targetTableName: 'inquiry',
      targetRecordId: 'INQ-20250107-001',
      recordedAt: new Date('2025-01-07T09:00:00Z'),
    });

    const mockAiClient: Tx7Imp1AiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing_issue',
        complexity: 'high',
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

    expect(result.status).toBe('escalated');
    expect(result.errorDetails).toBeNull();
  });
});
