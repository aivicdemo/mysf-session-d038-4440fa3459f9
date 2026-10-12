import { classifyAndRespondToIssue } from '../../src/logic/issue-response-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/notification-service');

describe('SCEN-265: 金額ズレが5%以上で顧客対応が必要な場合、通知対象に顧客情報が含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額ズレが5%以上のとき、顧客情報が通知対象に含まれる', async () => {
    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.MockedFunction<typeof dataPersistence.fetchDealsWithInvoices>;
    const mockRetrieveModificationHistory = modificationTracking.retrieveModificationHistoryByTargetRecord as jest.MockedFunction<typeof modificationTracking.retrieveModificationHistoryByTargetRecord>;

    mockFetchDealsWithInvoices.mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440002',
            customerId: 'cust-001',
            salesRepresentativeId: 'sr-001',
            dealName: 'Test Deal',
            dealAmount: 1000000,
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
          invoices: [
            {
              invoice: {
                invoiceId: '550e8400-e29b-41d4-a716-446655440003',
                dealId: '550e8400-e29b-41d4-a716-446655440002',
                customerId: 'cust-001',
                salesRepresentativeId: 'sr-001',
                invoiceNumber: 'INV-001',
                invoiceDate: '2025-01-14',
                dueDate: '2025-02-14',
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
                createdAt: '2025-01-14T09:00:00Z',
                updatedAt: '2025-01-14T09:00:00Z',
                createdBy: 'user-001',
              },
              lineItems: [],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T14:00:00Z',
    });

    mockRetrieveModificationHistory.mockResolvedValue({
      modificationRecords: [],
      totalCount: 0,
    });

    const input = {
      issueReportId: '550e8400-e29b-41d4-a716-446655440001',
      dealId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceId: '550e8400-e29b-41d4-a716-446655440003',
      issueType: 'amount_discrepancy',
      reportedAmount: 950000,
      reportedReason: '請求書の金額が商談金額と異なる。商談では1,000,000円だが、請求書には950,000円と記載されている。',
      reportedDateTime: '2025-01-15T10:30:00Z',
      currentDateTime: '2025-01-15T14:00:00Z',
      requestingUserId: '550e8400-e29b-41d4-a716-446655440099',
    };

    const result = await classifyAndRespondToIssue(input);

    expect(result).toBeDefined();
    expect(result.issueRootCause).toBe('incorrect_amount_calculation');
    expect(result.responseAction).toBe('customer_contact_required');
    expect(result.responseActionDescription).toContain('5%以上');
    expect(result.responseActionDescription).toContain('顧客');
    expect(result.requiredSteps).toBeDefined();
    expect(result.requiredSteps.some(step => step.includes('顧客'))).toBe(true);
    const estimatedDateTime = new Date(result.estimatedResolutionDateTime);
    const currentDateTime = new Date('2025-01-15T14:00:00Z');
    const daysDiff = (estimatedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeLessThanOrEqual(5);
    expect(result.responseDecisionDateTime).toBe('2025-01-15T14:00:00Z');
    expect(result.notificationContent).toBeDefined();
  });
});
