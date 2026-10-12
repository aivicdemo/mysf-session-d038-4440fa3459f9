import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-271: estimatedResolutionDateTimeが正確に算出される（対応ルートと優先度に基づく計算）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対応ルートと優先度に基づいてestimatedResolutionDateTimeが算出される', async () => {
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
            expectedContractDate: '2024-10-11',
            contractedDate: '2024-10-11',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2024-10-11T00:00:00Z',
            updatedAt: '2024-10-11T00:00:00Z',
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
                invoiceDate: '2024-10-11',
                dueDate: '2024-11-30',
                invoiceAmount: 1000000,
                taxAmount: 100000,
                untaxedAmount: 900000,
                invoiceStatus: 'generated',
                paidDate: null,
                paidAmount: null,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'verified',
                referenceIntegrityVerificationStatus: 'verified',
                createdAt: '2024-10-11T00:00:00Z',
                updatedAt: '2024-10-11T00:00:00Z',
                createdBy: 'user-001',
              },
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-12-15T10:00:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      invoiceId: '770e8400-e29b-41d4-a716-446655440002',
      issueType: 'billing_omission',
      reportedAmount: null,
      reportedReason: '請求書が発行されてから35日経過しても顧客に到達していない',
      reportedDateTime: '2024-12-15T10:00:00Z',
      currentDateTime: '2024-12-15T10:00:00Z',
      requestingUserId: '880e8400-e29b-41d4-a716-446655440003',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result).toBeDefined();
    expect(result.issueRootCause).toBe('system_processing_delay');
    expect(result.responseAction).toBe('correct_and_regenerate');
    expect(result.responseActionDescription).toContain('再発行');
    expect(result.requiredSteps).toBeDefined();
    expect(result.requiredSteps.length).toBeGreaterThan(0);

    // Verify estimated resolution datetime calculation
    const estimatedDateTime = new Date(result.estimatedResolutionDateTime);
    const currentDateTime = new Date('2024-12-15T10:00:00Z');
    const daysDiff = (estimatedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60 * 24);
    // Based on the specification, system fix route has 3 days resolution estimate
    expect(daysDiff).toBe(3);
    expect(result.estimatedResolutionDateTime).toBe('2024-12-18T10:00:00Z');

    expect(result.responseDecisionDateTime).toBe('2024-12-15T10:00:00Z');
    expect(result.notificationContent).toBeDefined();
  });
});
