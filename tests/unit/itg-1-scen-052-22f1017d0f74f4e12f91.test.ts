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

describe('SCEN-052: 高複雑度の問い合わせが入力された場合、分析結果の複雑度が high で返される', () => {
  let mockAiClient: Tx7Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {
      analyzeInquiry: jest.fn().mockResolvedValue({
        inquiryType: 'billing_issue',
        complexity: 'high',
        rootCause: '複数の請求書金額とシステム上の商談金額の500万円差異、複数部門の取引条件の混在、国際送金に関わる税務処理の確認が必要',
        suggestedResolution: '財務部門・営業部門・法務部門を巻き込んだ複合案件として、契約内容の確認、為替変動の影響分析、B/L遅延に伴う利息計算の検証が必要'
      }),
      identifyCustomer: jest.fn().mockResolvedValue({
        customerId: 'CUST-000847',
        customerName: '株式会社ABC'
      }),
      fetchHistory: jest.fn().mockResolvedValue({
        deals: [{
          dealId: 'DEAL-2024-0512',
          dealName: 'ABC向け2024年度取引',
          amount: 25000000,
          stage: 'closed_won',
          date: new Date('2024-12-15T00:00:00Z')
        }],
        invoices: [
          {
            invoiceId: 'INV-2024-10-001',
            invoiceNumber: 'INV-2024-10-001',
            amount: 8500000,
            status: 'paid',
            date: new Date('2024-10-20T00:00:00Z')
          },
          {
            invoiceId: 'INV-2024-11-002',
            invoiceNumber: 'INV-2024-11-002',
            amount: 9200000,
            status: 'paid',
            date: new Date('2024-11-18T00:00:00Z')
          },
          {
            invoiceId: 'INV-2024-12-003',
            invoiceNumber: 'INV-2024-12-003',
            amount: 7300000,
            status: 'pending',
            date: new Date('2024-12-25T00:00:00Z')
          }
        ],
        activities: [{
          activityId: 'ACT-2024-1847',
          type: 'contract_negotiation',
          date: new Date('2024-10-05T00:00:00Z'),
          content: '特別割引条件（15%）適用の合意。契約期間2022年4月～2025年3月'
        }]
      }),
      escalateInquiry: jest.fn().mockResolvedValue({
        escalatedToUserId: 'USR-MANAGER-001',
        escalationReason: '複雑度high案件。複数部門にまたがる取引条件確認、国際送金に関する税務相談、3年間の履歴検証が必要'
      })
    };

    (responseTimeSlaManagement.evaluateAndEscalateInquiryResponseSLA as jest.Mock).mockResolvedValue({
      complexity: 'high',
      escalationReason: '複数部門の取引条件確認、国際送金に関する税務相談、3年間の履歴検証が必要な複雑案件'
    });

    (customerDeduplication.deduplicateAndIdentifyCustomer as jest.Mock).mockResolvedValue({
      customerId: 'CUST-000847',
      customerName: '株式会社ABC'
    });

    (dataPersistence.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      deals: [{
        dealId: 'DEAL-2024-0512',
        dealName: 'ABC向け2024年度取引',
        amount: 25000000,
        stage: 'closed_won',
        date: new Date('2024-12-15T00:00:00Z')
      }],
      invoices: [
        {
          invoiceId: 'INV-2024-10-001',
          invoiceNumber: 'INV-2024-10-001',
          amount: 8500000,
          status: 'paid',
          date: new Date('2024-10-20T00:00:00Z')
        },
        {
          invoiceId: 'INV-2024-11-002',
          invoiceNumber: 'INV-2024-11-002',
          amount: 9200000,
          status: 'paid',
          date: new Date('2024-11-18T00:00:00Z')
        },
        {
          invoiceId: 'INV-2024-12-003',
          invoiceNumber: 'INV-2024-12-003',
          amount: 7300000,
          status: 'pending',
          date: new Date('2024-12-25T00:00:00Z')
        }
      ],
      activities: [{
        activityId: 'ACT-2024-1847',
        type: 'contract_negotiation',
        date: new Date('2024-10-05T00:00:00Z'),
        content: '特別割引条件（15%）適用の合意。契約期間2022年4月～2025年3月'
      }]
    });

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      userId: 'USR-00512',
      accessLevel: 'full'
    });

    (mobileSecurityEnforcement.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue({
      deviceType: 'desktop',
      securityPolicyApplied: false
    });

    (notificationService.notifyIssueResponse as jest.Mock).mockResolvedValue({
      notificationSent: true,
      notificationMethod: 'email'
    });
  });

  test('高複雑度の問い合わせ入力で、分析結果の複雑度が high で返されること', async () => {
    const input = {
      inquiryId: 'INQ-20250107-00152',
      inquirerIdentification: {
        name: '山田太郎',
        email: 'yamada.taro@example.com',
        phoneNumber: '090-1234-5678',
        companyName: '株式会社ABC'
      },
      inquiryContent: {
        type: 'billing_issue',
        subject: '複数の請求書に記載された金額に矛盾があり、且つ過去3年間の商談履歴との不整合が発生しており、さらに複数の部門にまたがる取引条件の確認が必要で、国際送金に関する税務上の質問も含まれている',
        description: '2024年10月から12月にかけて受け取った請求書3件の合計金額が、営業システムに記録されている商談金額と500万円の差異がある。また、2022年の契約時点での特別割引条件の適用状況が不明確で、複数の営業チームからの発注内容が混在している。これに加えて、国際送金時の為替変動による影響と、B/L（船荷証券）の遅延に伴う利息計算について確認が必要である。',
        attachmentUrls: [
          'https://s3.amazonaws.com/invoices/INV-2024-10-001.pdf',
          'https://s3.amazonaws.com/invoices/INV-2024-11-002.pdf',
          'https://s3.amazonaws.com/contracts/CONTRACT-2022-ABC-SPECIAL.pdf'
        ]
      },
      receivedDateTime: new Date('2025-01-07T14:30:00Z'),
      userId: 'USR-00512',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '203.0.113.42',
        sessionId: 'sess-ae8f9c2d-6e41-4b92-a1f2-9d7e5c8b3a6f'
      }
    };

    const result = await runTx7Imp1Agent(input, mockAiClient);

    expect(result.inquiryId).toBe('INQ-20250107-00152');
    expect(result.status).toBe('escalated');
    expect(result.identifiedCustomerId).toBe('CUST-000847');
    expect(result.analysisResult.complexity).toBe('high');
    expect(result.analysisResult.inquiryType).toBe('billing_issue');
    expect(result.analysisResult.rootCause).toBeDefined();
    expect(result.analysisResult.suggestedResolution).toBeDefined();
    expect(result.escalationReason).toBeDefined();
    expect(result.notificationSent).toBe(true);
    expect(result.processingTimeMs).toBeGreaterThan(0);
    expect(result.completedDateTime).toBeDefined();

    expect(responseTimeSlaManagement.evaluateAndEscalateInquiryResponseSLA).toHaveBeenCalled();
    expect(customerDeduplication.deduplicateAndIdentifyCustomer).toHaveBeenCalled();
    expect(dataPersistence.fetchCustomerWithRelatedRecords).toHaveBeenCalled();
    expect(dataPersistence.fetchUserPermissions).toHaveBeenCalled();
    expect(mobileSecurityEnforcement.enforceSecurityPolicyForMobileAccess).toHaveBeenCalled();
    expect(notificationService.notifyIssueResponse).toHaveBeenCalled();
  });
});
