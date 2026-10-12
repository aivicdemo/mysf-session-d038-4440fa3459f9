import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-261: 商談金額が0以下のとき、業務ルールの制約エラーが throw される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談金額が-5000のとき、制約エラーが throw される', async () => {
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
            dealAmount: -5000,
            stageId: 'stage-001',
            expectedContractDate: '2025-01-10',
            contractedDate: '2025-01-05',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2025-01-05T00:00:00Z',
            updatedAt: '2025-01-05T00:00:00Z',
            createdBy: 'user-001',
          },
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T11:00:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      invoiceId: null,
      issueType: 'amount_discrepancy',
      reportedAmount: -5000,
      reportedReason: '商談金額がシステムに不正な値として記録されている',
      reportedDateTime: '2025-01-15T10:30:00Z',
      currentDateTime: '2025-01-15T11:00:00Z',
      requestingUserId: '550e8400-e29b-41d4-a716-446655440002',
    };

    const error = await classifyAndRespondToIssue(input).catch(e => e);
    expect(error).toBeDefined();
    expect(error.message).toBe('商談金額が不正です。確認してください');
  });
});
