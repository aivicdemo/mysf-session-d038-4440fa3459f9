import { submitIssueReport, type SubmitIssueReportInput } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-244: submitIssueReport with valid required fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record the report with normalized content and return reportId, recordedAt', async () => {
    const currentDateTime = new Date('2025-01-07T10:30:00Z');
    const dealId = 'DEAL-20250107-001';
    const reportedBy = 'SALES-00123';

    const input: SubmitIssueReportInput = {
      dealId,
      issueType: 'unbilled',
      reportContent: {
        reason: '商談成立後、請求書が発行されていない状態が続いている',
        expectedInvoiceDate: new Date('2025-01-05'),
        expectedInvoiceAmount: 250000,
        currentStatus: '未請求',
      },
      reportedBy,
      currentDateTime,
    };

    // Setup mocks
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SALES-00123',
      dealName: 'Test Deal',
      dealAmount: 250000,
      stageId: 'stage-001',
      expectedContractDate: '2025-01-01',
      contractedDate: '2025-01-01',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:30:00Z',
    });

    (dataPersistence.fetchOperationAuditLogsByRecord as jest.Mock).mockResolvedValue({
      operationLogs: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:30:00Z',
    });

    (modificationTracking.recordModificationWithHistory as jest.Mock).mockResolvedValue({
      recordId: 'REPORT-ABC123',
      modifiedAt: currentDateTime,
    });

    (auditLogging.recordUserOperation as jest.Mock).mockResolvedValue({
      operationAuditLogId: 'AUDIT-001',
    });

    const result = await submitIssueReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toMatch(/^REPORT-/);
    expect(result.dealId).toBe(dealId);
    expect(result.issueType).toBe('unbilled');
    expect(result.normalizedContent).toEqual(input.reportContent);
    expect(result.recordedAt).toBeInstanceOf(Date);
    expect(result.status).toBe('recorded');

    // Verify the mocked functions were called
    expect(dataPersistence.fetchDealById).toHaveBeenCalled();
    expect(dataPersistence.fetchInvoicesWithoutDeal).toHaveBeenCalled();
    expect(dataPersistence.fetchOperationAuditLogsByRecord).toHaveBeenCalled();
    expect(modificationTracking.recordModificationWithHistory).toHaveBeenCalled();
    expect(auditLogging.recordUserOperation).toHaveBeenCalled();
  });
});
