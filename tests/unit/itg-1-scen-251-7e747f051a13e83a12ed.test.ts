import { submitIssueReport, DuplicateReportExists } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';
import { SubmitIssueReportInput, IssueReportContent } from '../../src/logic/issue-reporting-coordination';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-251: submitIssueReport - DuplicateReportExists error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DuplicateReportExists error when identical report exists within past 7 days', async () => {
    // Preconditions
    const dealId = 'DEAL-20250107-001';
    const issueType = 'unbilled';
    const reportContent: IssueReportContent = {
      reason: '2024年12月分の請求漏れ',
      expectedInvoiceDate: new Date('2025-01-15'),
      currentStatus: '未請求',
      expectedInvoiceAmount: 500000,
    };
    const reportedBy = 'SALES-EMP-0042';
    const currentDateTime = new Date('2025-01-07T14:30:00Z');

    // Setup mocks - use jest.requireActual to preserve other exports
    const actualDataPersistence = jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence');

    const mockDealData = {
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SALES-EMP-0042',
      dealName: 'Test Deal',
      dealAmount: 500000,
      stageId: 'stage-1',
      expectedContractDate: '2025-02-01',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      createdBy: 'SALES-EMP-0042',
    };

    const mockInvoicesData = {
      invoices: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
    };

    const mockAuditLogs = {
      operationLogs: [
        {
          operationAuditLogId: 'LOG-001',
          userId: 'SALES-EMP-0042',
          operationType: 'submit_issue_report',
          targetTableName: 'issue_report',
          targetRecordId: 'DEAL-20250107-001',
          changeBeforeValue: null,
          changeAfterValue: JSON.stringify({
            dealId: 'DEAL-20250107-001',
            issueType: 'unbilled',
            reportContent: {
              reason: '2024年12月分の請求漏れ',
              expectedInvoiceDate: '2025-01-15',
              currentStatus: '未請求',
              expectedInvoiceAmount: 500000,
            },
          }),
          operationDetailContent: JSON.stringify({
            dealId: 'DEAL-20250107-001',
            issueType: 'unbilled',
            reportContent: {
              reason: '2024年12月分の請求漏れ',
              expectedInvoiceDate: '2025-01-15',
              currentStatus: '未請求',
              expectedInvoiceAmount: 500000,
            },
          }),
          ipAddress: '127.0.0.1',
          sessionId: 'sess-123',
          operationStatus: 'success',
          errorMessage: null,
          operationExecutionTimestamp: '2025-01-06T10:15:00Z',
          createdAt: '2025-01-06T10:15:00Z',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealData);
    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue(mockInvoicesData);
    (dataPersistence.fetchOperationAuditLogsByRecord as jest.Mock).mockResolvedValue(mockAuditLogs);

    // Test input
    const input: SubmitIssueReportInput = {
      dealId,
      issueType,
      reportContent,
      reportedBy,
      currentDateTime,
    };

    // Execute and verify error is thrown
    await expect(submitIssueReport(input)).rejects.toThrow(DuplicateReportExists);

    // Verify the error message contains the expected text
    try {
      await submitIssueReport(input);
      fail('Should have thrown DuplicateReportExists error');
    } catch (error) {
      if (error instanceof DuplicateReportExists) {
        expect(error.message).toBe('この商談に対して同様の報告が既に登録されています。');
      } else {
        throw error;
      }
    }

    // Verify that modification and audit logging were not called
    const modificationTracking = require('../../src/logic/modification-tracking');
    const auditLogging = require('../../src/logic/audit-logging');
    expect(modificationTracking.recordModificationWithHistory).not.toHaveBeenCalled();
    expect(auditLogging.recordUserOperation).not.toHaveBeenCalled();
  });
});
