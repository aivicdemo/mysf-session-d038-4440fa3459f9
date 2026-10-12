import { classifyAndRespondToIssue, UnclassifiableIssueRootCause } from '../../src/logic/issue-response-management';
import type { SaveDealOutput } from '../../src/logic/data-persistence';
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

describe('SCEN-258: 報告内容から原因が分類できない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UnclassifiableIssueRootCauseエラーが発生する', async () => {
    const mockDealWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: '660e8400-e29b-41d4-a716-446655440001',
            dealAmount: 500000,
            dealStatus: 'closed_won',
            customerId: 'cust-001',
            salesRepresentativeId: 'rep-001',
            dealName: 'Test Deal',
            stageId: 'stage-closed-won',
            expectedContractDate: '2025-12-15',
            contractedDate: '2025-12-15',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2025-12-15T00:00:00Z',
            updatedAt: '2025-12-15T00:00:00Z',
            createdBy: 'user-admin',
          } as SaveDealOutput,
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-01-20T14:30:00Z',
    };

    const mockModificationHistory = {
      modificationRecords: [],
      totalCount: 0,
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(mockDealWithInvoices);
    (modificationTracking.retrieveModificationHistoryByTargetRecord as jest.Mock).mockResolvedValue(mockModificationHistory);

    await expect(
      classifyAndRespondToIssue({
        issueReportId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        invoiceId: null,
        issueType: 'billing_omission',
        reportedAmount: null,
        reportedReason: '曖昧な背景情報のみ記載',
        reportedDateTime: '2026-01-15T10:00:00Z',
        currentDateTime: '2026-01-20T14:30:00Z',
        requestingUserId: '770e8400-e29b-41d4-a716-446655440002',
      })
    ).rejects.toThrow(UnclassifiableIssueRootCause);
  });
});
