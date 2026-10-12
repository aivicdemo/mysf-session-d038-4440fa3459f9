import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import type { ClassifyAndRespondToIssueOutput } from '../../src/logic/issue-response-management';
import type { SaveDealOutput, SaveInvoiceOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealsWithInvoices: jest.fn(),
}));
jest.mock('../../src/logic/modification-tracking', () => ({
  ...jest.requireActual<typeof import('../../src/logic/modification-tracking')>('../../src/logic/modification-tracking'),
  retrieveModificationHistoryByTargetRecord: jest.fn(),
}));
jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  notifyIssueResponse: jest.fn(),
}));

describe('SCEN-252: 請求漏れが30日以上前から報告されている場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('高優先度で修正・再発行対応が決定される', async () => {
    const dealState = {
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      dealStatus: 'closed_won',
      dealAmount: 500000,
      expectedBillingDate: '2024-12-10',
      actualBillingDate: null,
      invoiceId: null,
      invoiceAmount: null,
      invoiceGenerationDateTime: null,
      paymentDueDate: null,
    };

    const mockDealWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: dealState.dealId,
            dealStatus: dealState.dealStatus,
            dealAmount: dealState.dealAmount,
            customerId: 'cust-001',
            salesRepresentativeId: 'rep-001',
            dealName: 'Test Deal',
            stageId: 'stage-closed-won',
            expectedContractDate: '2024-12-10',
            contractedDate: '2024-12-10',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2024-12-01T00:00:00Z',
            updatedAt: '2024-12-10T00:00:00Z',
            createdBy: 'user-admin',
          } as SaveDealOutput,
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:30:00Z',
    };

    const mockModificationHistory = {
      modificationRecords: [],
      totalCount: 0,
    };

    const mockNotification = {
      notificationId: 'notif-001',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'user-accounting-001',
          userName: 'Accounting User',
          role: 'accounting_department',
          channel: 'email',
          sentAt: new Date('2025-01-15T10:30:00Z'),
        },
      ],
      responseNotificationId: 'resp-notif-001',
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(mockDealWithInvoices);
    (modificationTracking.retrieveModificationHistoryByTargetRecord as jest.Mock).mockResolvedValue(mockModificationHistory);
    (notificationService.notifyIssueResponse as jest.Mock).mockResolvedValue(mockNotification);

    const result = await classifyAndRespondToIssue({
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      invoiceId: null,
      issueType: 'billing_omission',
      reportedAmount: null,
      reportedReason: '商談成立から35日経過しているが請求書が発行されていない。顧客からの入金問い合わせあり。',
      reportedDateTime: '2025-01-15T10:30:00Z',
      currentDateTime: '2025-01-15T10:30:00Z',
      requestingUserId: 'user-accounting-001',
    });

    expect(result.issueRootCause).toBe('missing_invoice_generation');
    expect(result.responseAction).toBe('correct_and_regenerate');
    expect(result.responseActionDescription).toContain('36日前から未請求');
    expect(result.responseActionDescription).toContain('高優先度');
    expect(result.requiredSteps).toContain('請求書生成処理を実行');
    expect(result.requiredSteps).toContain('請求書PDF生成・出力');
    expect(result.requiredSteps).toContain('顧客への請求書発送確認');
    expect(result.requiredSteps).toContain('営業担当者へ完了通知');
    expect(result.responseDecisionDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.notificationContent.recipientUserId).toBe('user-accounting-001');
  });
});
