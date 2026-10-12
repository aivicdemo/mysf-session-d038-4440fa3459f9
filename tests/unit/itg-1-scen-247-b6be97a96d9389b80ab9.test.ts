import { submitIssueReport, type SubmitIssueReportInput, MissingRequiredReportFields } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-247: submitIssueReport with missing required report fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MissingRequiredReportFields error when reportContent has null required fields', async () => {
    const currentDateTime = new Date('2025-01-07T14:30:00Z');
    const dealId = 'DEAL-20250107-001';
    const reportedBy = 'SALES-USER-042';

    const input: SubmitIssueReportInput = {
      dealId,
      issueType: 'unbilled',
      reportContent: {
        reason: null as any,
        expectedInvoiceDate: null as any,
        currentStatus: null as any,
      },
      reportedBy,
      currentDateTime,
    };

    // Setup mocks
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'SALES-USER-042',
      dealName: 'Test Deal',
      dealAmount: 5000000,
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
      fetchedAt: '2025-01-07T14:30:00Z',
    });

    (dataPersistence.fetchOperationAuditLogsByRecord as jest.Mock).mockResolvedValue({
      operationLogs: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T14:30:00Z',
    });

    await expect(submitIssueReport(input)).rejects.toThrow(MissingRequiredReportFields);
    await expect(submitIssueReport(input)).rejects.toThrow('報告内容に必須項目が不足しています。報告理由、期待される請求日、実際の状態を入力してください。');
  });
});
