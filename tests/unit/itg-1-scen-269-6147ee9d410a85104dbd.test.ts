import { classifyAndRespondToIssue, UnclassifiableIssueRootCause } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-269: reportedAmountがnullで金額ズレ報告の場合、原因分類ができない状態になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reportedAmountがnullで金額ズレ報告のとき、UnclassifiableIssueRootCauseエラーが発生', async () => {
    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.MockedFunction<typeof dataPersistence.fetchDealsWithInvoices>;
    const mockRetrieveModificationHistory = modificationTracking.retrieveModificationHistoryByTargetRecord as jest.MockedFunction<typeof modificationTracking.retrieveModificationHistoryByTargetRecord>;

    mockFetchDealsWithInvoices.mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '660e8400-e29b-41d4-a716-446655440001',
            customerId: 'cust-001',
            salesRepresentativeId: 'sr-001',
            dealName: 'Test Deal',
            dealAmount: 1000000,
            stageId: 'stage-001',
            expectedContractDate: '2026-09-30',
            contractedDate: '2026-09-30',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2026-09-30T00:00:00Z',
            updatedAt: '2026-09-30T00:00:00Z',
            createdBy: 'user-001',
          },
          invoices: [
            {
              invoice: {
                invoiceId: '770e8400-e29b-41d4-a716-446655440002',
                dealId: '660e8400-e29b-41d4-a716-446655440001',
                customerId: 'cust-001',
                salesRepresentativeId: 'sr-001',
                invoiceNumber: 'INV-001',
                invoiceDate: '2026-09-30',
                dueDate: '2026-10-30',
                invoiceAmount: 950000,
                taxAmount: 95000,
                untaxedAmount: 855000,
                invoiceStatus: 'issued',
                paidDate: null,
                paidAmount: null,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'verified',
                referenceIntegrityVerificationStatus: 'verified',
                createdAt: '2026-09-30T09:00:00Z',
                updatedAt: '2026-09-30T09:00:00Z',
                createdBy: 'user-001',
              },
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T14:30:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: '770e8400-e29b-41d4-a716-446655440002',
      issueType: 'amount_discrepancy',
      reportedAmount: null,
      reportedReason: '請求書の金額が商談金額と異なっています',
      reportedDateTime: '2026-10-07T10:00:00Z',
      currentDateTime: '2026-10-07T14:30:00Z',
      requestingUserId: '880e8400-e29b-41d4-a716-446655440003',
    };

    await expect(classifyAndRespondToIssue(input)).rejects.toThrow(UnclassifiableIssueRootCause);
    const error = await classifyAndRespondToIssue(input).catch(e => e);
    expect(error.message).toBe('報告内容から原因を特定できません。営業担当者に詳細情報の追加報告を依頼してください。');
  });
});
