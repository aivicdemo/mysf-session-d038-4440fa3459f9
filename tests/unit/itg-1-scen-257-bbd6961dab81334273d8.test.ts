import { classifyAndRespondToIssue, InvoiceNotFound } from '../../src/logic/issue-response-management';
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

describe('SCEN-257: 請求書IDが指定されているが対応する請求書が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvoiceNotFoundエラーが発生する', async () => {
    const mockDealWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440001',
            dealAmount: 500000,
            dealStatus: 'closed_won',
            customerId: 'cust-001',
            salesRepresentativeId: 'rep-001',
            dealName: 'Test Deal',
            stageId: 'stage-closed-won',
            expectedContractDate: '2026-09-30',
            contractedDate: '2026-09-30',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-09-30T00:00:00Z',
            updatedAt: '2026-09-30T00:00:00Z',
            createdBy: 'user-admin',
          } as SaveDealOutput,
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T14:30:00Z',
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(mockDealWithInvoices);

    await expect(
      classifyAndRespondToIssue({
        issueReportId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '550e8400-e29b-41d4-a716-446655440001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440099',
        issueType: 'billing_omission',
        reportedAmount: null,
        reportedReason: '請求書が生成されていない',
        reportedDateTime: '2026-10-07T10:00:00Z',
        currentDateTime: '2026-10-07T14:30:00Z',
        requestingUserId: 'user-billing-001',
      })
    ).rejects.toThrow(InvoiceNotFound);
  });
});
