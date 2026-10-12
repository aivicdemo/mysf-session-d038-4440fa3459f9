import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-263: 実請求日が予定請求日より前のとき、業務ルールの制約警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('実請求日が予定請求日より前のとき、警告が記録されて正常に完了する', async () => {
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
            expectedContractDate: '2024-01-01',
            contractedDate: '2024-01-01',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
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
                invoiceDate: '2024-01-05',
                dueDate: '2024-02-05',
                invoiceAmount: 1000000,
                taxAmount: 100000,
                untaxedAmount: 900000,
                invoiceStatus: 'issued',
                paidDate: null,
                paidAmount: null,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'verified',
                referenceIntegrityVerificationStatus: 'verified',
                createdAt: '2024-01-05T09:00:00Z',
                updatedAt: '2024-01-05T09:00:00Z',
                createdBy: 'user-001',
              },
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: '770e8400-e29b-41d4-a716-446655440002',
      issueType: 'billing_delay',
      reportedAmount: null,
      reportedReason: '請求日が予定より前に発行されている。2024-01-05に発行されたが、予定は2024-01-10だった',
      reportedDateTime: '2024-01-15T10:00:00Z',
      currentDateTime: '2024-01-15T10:30:00Z',
      requestingUserId: '880e8400-e29b-41d4-a716-446655440003',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result).toBeDefined();
    expect(result.issueRootCause).toBe('system_processing_delay');
    expect(result.responseAction).toBe('manual_review_required');
    expect(result.responseActionDescription).toContain('不整合');
    expect(result.notificationContent).toBeDefined();
    expect(result.notificationContent.subject || result.notificationContent.message).toContain('データ不整合');
  });
});
