import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-264: 請求漏れが30日未満前から報告されている場合、中優先度で対応が決定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求漏れが20日前から報告されているとき、中優先度で対応が決定される', async () => {
    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.MockedFunction<typeof dataPersistence.fetchDealsWithInvoices>;
    const mockRetrieveModificationHistory = modificationTracking.retrieveModificationHistoryByTargetRecord as jest.MockedFunction<typeof modificationTracking.retrieveModificationHistoryByTargetRecord>;
    const mockNotifyIssueResponse = notificationService.notifyIssueResponse as jest.MockedFunction<typeof notificationService.notifyIssueResponse>;

    mockFetchDealsWithInvoices.mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440001',
            customerId: 'cust-001',
            salesRepresentativeId: 'sr-001',
            dealName: 'Test Deal',
            dealAmount: 500000,
            stageId: 'stage-001',
            expectedContractDate: '2025-01-01',
            contractedDate: '2025-01-01',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            createdBy: 'user-001',
          },
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-21T10:30:00Z',
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
          sentAt: new Date('2025-01-21T10:30:00Z'),
        },
      ],
      responseNotificationId: 'notif-001',
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      invoiceId: null,
      issueType: 'billing_omission',
      reportedAmount: null,
      reportedReason: '商談成立から20日経過しているが請求書が発行されていない',
      reportedDateTime: '2025-01-21T10:30:00Z',
      currentDateTime: '2025-01-21T10:30:00Z',
      requestingUserId: '550e8400-e29b-41d4-a716-446655440002',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result).toBeDefined();
    expect(result.issueRootCause).toBe('missing_invoice_generation');
    expect(result.responseAction).toBe('reissue_invoice');
    expect(result.responseActionDescription).toContain('再発行');
    expect(result.requiredSteps).toBeDefined();
    expect(result.requiredSteps.length).toBeGreaterThan(0);
    expect(result.estimatedResolutionDateTime).toBeDefined();
    const estimatedDateTime = new Date(result.estimatedResolutionDateTime);
    const currentDateTime = new Date('2025-01-21T10:30:00Z');
    const daysDiff = (estimatedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeLessThanOrEqual(1);
    expect(result.responseDecisionDateTime).toBe('2025-01-21T10:30:00Z');
    expect(mockNotifyIssueResponse).toHaveBeenCalled();
  });
});
