import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-268: invoiceIdがnullで未請求の場合、請求漏れとして適切に分類される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invoiceIdがnullのとき、請求漏れとして分類される', async () => {
    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.MockedFunction<typeof dataPersistence.fetchDealsWithInvoices>;
    const mockRetrieveModificationHistory = modificationTracking.retrieveModificationHistoryByTargetRecord as jest.MockedFunction<typeof modificationTracking.retrieveModificationHistoryByTargetRecord>;

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
            expectedContractDate: '2026-09-15',
            contractedDate: '2026-09-15',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-09-15T00:00:00Z',
            updatedAt: '2026-09-15T00:00:00Z',
            createdBy: 'user-001',
          },
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T15:30:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      invoiceId: null,
      issueType: 'billing_omission',
      reportedAmount: null,
      reportedReason: '商談から請求書が生成されていない。確認をお願いします。',
      reportedDateTime: '2026-10-07T10:00:00Z',
      currentDateTime: '2026-10-07T15:30:00Z',
      requestingUserId: 'user-accounting-001',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result).toBeDefined();
    expect(result.issueRootCause).toBe('missing_invoice_generation');
    expect(result.responseAction).toBe('correct_and_regenerate');
    expect(result.responseActionDescription).toContain('未請求');
    expect(result.requiredSteps).toBeDefined();
    expect(result.requiredSteps.length).toBeGreaterThan(0);
    expect(result.requiredSteps.some(step => step.includes('請求書'))).toBe(true);
    expect(result.estimatedResolutionDateTime).toBeDefined();
    const estimatedDateTime = new Date(result.estimatedResolutionDateTime);
    const currentDateTime = new Date('2026-10-07T15:30:00Z');
    const hoursDiff = (estimatedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeLessThanOrEqual(24);
    expect(result.responseDecisionDateTime).toBeDefined();
    expect(result.notificationContent).toBeDefined();
  });
});
