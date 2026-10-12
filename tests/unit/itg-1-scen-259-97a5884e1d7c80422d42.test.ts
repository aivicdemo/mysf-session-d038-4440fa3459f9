import { classifyAndRespondToIssue, ResponseActionNotDeterminable } from '../../src/logic/issue-response-management';
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

describe('SCEN-259: 分類された原因に対応する対応方法が決定できない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ResponseActionNotDeterminableエラーが発生する', async () => {
    const mockDealWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440001',
            dealAmount: 100000,
            dealStatus: 'closed_won',
            customerId: 'cust-001',
            salesRepresentativeId: 'rep-001',
            dealName: 'Test Deal',
            stageId: 'stage-closed-won',
            expectedContractDate: '2026-10-05',
            contractedDate: '2026-10-05',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-10-05T00:00:00Z',
            updatedAt: '2026-10-10T09:00:00Z',
            createdBy: 'user-admin',
          } as SaveDealOutput,
          invoices: [
            {
              invoice: {
                invoiceId: '550e8400-e29b-41d4-a716-446655440002',
                dealId: '550e8400-e29b-41d4-a716-446655440001',
                invoiceAmount: 95000,
                invoiceDate: '2026-10-10',
                dueDate: '2026-11-10',
                invoiceStatus: 'issued',
                customerId: 'cust-001',
                salesRepresentativeId: 'rep-001',
                invoiceNumber: 'INV-001',
                taxAmount: 0,
                untaxedAmount: 95000,
                paidDate: null,
                paidAmount: null,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'passed',
                referenceIntegrityVerificationStatus: 'passed',
                createdAt: '2026-10-10T09:00:00Z',
                updatedAt: '2026-10-10T09:00:00Z',
                createdBy: 'user-admin',
              } as SaveInvoiceOutput,
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-15T14:00:00Z',
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
        dealId: '550e8400-e29b-41d4-a716-446655440001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440002',
        issueType: 'amount_discrepancy',
        reportedAmount: 95000,
        reportedReason: '請求書の金額が商談金額と異なっている。原因は不明。',
        reportedDateTime: '2026-10-15T10:30:00Z',
        currentDateTime: '2026-10-15T14:00:00Z',
        requestingUserId: 'user-billing-001',
      })
    ).rejects.toThrow(ResponseActionNotDeterminable);
  });
});
