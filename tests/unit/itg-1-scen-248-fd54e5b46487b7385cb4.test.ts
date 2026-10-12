import { submitIssueReport, InvalidReportFormat } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
  fetchOperationAuditLogsByRecord: jest.fn(),
}));
jest.mock('../../src/logic/modification-tracking.ts');
jest.mock('../../src/logic/audit-logging.ts');

describe('SCEN-248: 報告内容がテキスト長制限超過や不正な文字列形式など標準化ルールに違反していると InvalidReportFormat エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reportContent の reason フィールドが5001文字で制限超過の場合、InvalidReportFormat エラーが発生する', async () => {
    const dealId = 'DEAL-12345';
    const reportedBy = 'SALES-789';
    const currentDateTime = new Date('2024-01-10T10:00:00Z');

    const longReason = 'a'.repeat(5001);

    const reportContent = {
      reason: longReason,
      expectedInvoiceDate: new Date('2024-01-15'),
      currentStatus: 'not_billed',
    };

    const mockDeal = {
      dealId,
      customerId: 'CUSTOMER-001',
      salesRepresentativeId: reportedBy,
      dealName: 'Test Deal',
      dealAmount: 100000,
      stageId: 'stage-active',
      expectedContractDate: '2024-01-15',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-10',
      createdBy: reportedBy,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
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

    await expect(
      submitIssueReport({
        dealId,
        issueType: 'unbilled',
        reportContent,
        reportedBy,
        currentDateTime,
      })
    ).rejects.toThrow(InvalidReportFormat);
  });
});
