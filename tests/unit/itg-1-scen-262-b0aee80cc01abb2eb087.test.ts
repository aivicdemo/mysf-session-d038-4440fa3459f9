import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-262: 予定請求日が現在日時より未来のとき、業務ルールの制約警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('予定請求日が現在日時より未来のとき、警告が記録されて正常に完了する', async () => {
    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.MockedFunction<typeof dataPersistence.fetchDealsWithInvoices>;
    const mockRetrieveModificationHistory = modificationTracking.retrieveModificationHistoryByTargetRecord as jest.MockedFunction<typeof modificationTracking.retrieveModificationHistoryByTargetRecord>;
    const mockNotifyIssueResponse = notificationService.notifyIssueResponse as jest.MockedFunction<typeof notificationService.notifyIssueResponse>;

    mockFetchDealsWithInvoices.mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '660e8400-e29b-41d4-a716-446655440001',
            customerId: 'cust-001',
            salesRepresentativeId: 'sr-001',
            dealName: 'Test Deal',
            dealAmount: 150000,
            stageId: 'stage-001',
            expectedContractDate: '2026-10-01',
            contractedDate: '2026-10-01',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-10-01T00:00:00Z',
            updatedAt: '2026-10-01T00:00:00Z',
            createdBy: 'user-001',
          },
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T14:00:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    mockNotifyIssueResponse.mockResolvedValue({
      notificationId: 'notif-001',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'user-001',
          userName: 'Test User',
          role: 'sales_representative',
          channel: 'email',
          sentAt: new Date('2026-10-07T14:00:00Z'),
        },
      ],
      responseNotificationId: 'notif-001',
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: null,
      issueType: 'billing_omission',
      reportedAmount: null,
      reportedReason: '商談成立後、請求書が未発行のまま経過している',
      reportedDateTime: '2026-10-07T10:30:00Z',
      currentDateTime: '2026-10-07T14:00:00Z',
      requestingUserId: '770e8400-e29b-41d4-a716-446655440002',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result).toBeDefined();
    expect(result.issueRootCause).toBe('missing_invoice_generation');
    expect(result.responseAction).toBeDefined();
    expect(result.responseActionDescription).toBeDefined();
    expect(result.requiredSteps).toBeDefined();
    expect(result.requiredSteps.length).toBeGreaterThan(0);
    expect(result.estimatedResolutionDateTime).toBeDefined();
    expect(result.notificationContent).toBeDefined();
    expect(result.responseDecisionDateTime).toBe('2026-10-07T14:00:00Z');
  });
});
