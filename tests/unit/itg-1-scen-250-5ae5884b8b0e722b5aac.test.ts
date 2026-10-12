import { submitIssueReport, type SubmitIssueReportInput, ReporterNotAuthorized } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-250: submitIssueReport with unauthorized reporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReporterNotAuthorized error when reporter is not the assigned sales user', async () => {
    const currentDateTime = new Date('2024-01-10T10:00:00Z');
    const dealId = 'DEAL-001';
    const reportedBy = 'SALES-USER-002';

    const input: SubmitIssueReportInput = {
      dealId,
      issueType: 'unbilled',
      reportContent: {
        reason: 'Invoice not generated for Q4 services',
        expectedInvoiceDate: new Date('2024-01-15'),
        currentStatus: 'No invoice issued',
        expectedInvoiceAmount: 50000,
      },
      reportedBy,
      currentDateTime,
    };

    // Setup mocks
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SALES-USER-001',
      dealName: 'Test Deal',
      dealAmount: 50000,
      stageId: 'stage-001',
      expectedContractDate: '2024-01-01',
      contractedDate: '2024-01-01',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'SYSTEM',
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: '2024-01-10T10:00:00Z',
    });

    (dataPersistence.fetchOperationAuditLogsByRecord as jest.Mock).mockResolvedValue({
      operationLogs: [],
      totalCount: 0,
      fetchedAt: '2024-01-10T10:00:00Z',
    });

    await expect(submitIssueReport(input)).rejects.toThrow(ReporterNotAuthorized);
    await expect(submitIssueReport(input)).rejects.toThrow('この商談に関連する営業担当者のみ報告できます。');
  });
});
