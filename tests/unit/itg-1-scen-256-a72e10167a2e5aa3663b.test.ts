import { classifyAndRespondToIssue, DealNotFound } from '../../src/logic/issue-response-management';
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

describe('SCEN-256: 報告対象の商談が存在しない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DealNotFoundエラーが発生する', async () => {
    const mockDealWithInvoices = {
      dealsWithInvoices: [],
      totalCount: 0,
      fetchedAt: '2026-01-15T14:45:00Z',
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(mockDealWithInvoices);

    await expect(
      classifyAndRespondToIssue({
        issueReportId: '550e8400-e29b-41d4-a716-446655440000',
        dealId: '660e8400-e29b-41d4-a716-446655440001',
        invoiceId: null,
        issueType: 'billing_omission',
        reportedAmount: null,
        reportedReason: '商談が完了したが請求書が生成されていない',
        reportedDateTime: '2026-01-15T10:30:00Z',
        currentDateTime: '2026-01-15T14:45:00Z',
        requestingUserId: '770e8400-e29b-41d4-a716-446655440002',
      })
    ).rejects.toThrow(DealNotFound);
  });
});
