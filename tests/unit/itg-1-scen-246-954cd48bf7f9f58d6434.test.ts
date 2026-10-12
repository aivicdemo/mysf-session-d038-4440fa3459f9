import { submitIssueReport, type SubmitIssueReportInput, DealNotFound } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';
import * as auditLogging from '../../src/logic/audit-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');
jest.mock('../../src/logic/audit-logging');

describe('SCEN-246: submitIssueReport with non-existent deal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealNotFound error when deal does not exist', async () => {
    const currentDateTime = new Date('2024-01-20T10:30:00Z');
    const dealId = 'DEAL-99999';
    const reportedBy = 'SALES-001';

    const input: SubmitIssueReportInput = {
      dealId,
      issueType: 'unbilled',
      reportContent: {
        reason: '請求書が発行されていない',
        expectedInvoiceDate: new Date('2024-01-15'),
        currentStatus: '商品納品完了、請求未発行',
      },
      reportedBy,
      currentDateTime,
    };

    // Setup mocks
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(null);
    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: '2024-01-20T10:30:00Z',
    });
    (dataPersistence.fetchOperationAuditLogsByRecord as jest.Mock).mockResolvedValue({
      operationLogs: [],
      totalCount: 0,
      fetchedAt: '2024-01-20T10:30:00Z',
    });

    await expect(submitIssueReport(input)).rejects.toThrow(DealNotFound);
    await expect(submitIssueReport(input)).rejects.toThrow('指定された商談が見つかりません。商談IDを確認してください。');
  });
});
