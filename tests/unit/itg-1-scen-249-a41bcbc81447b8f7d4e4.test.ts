import { submitIssueReport } from '../../src/logic/issue-reporting-coordination';
import * as dataPersistence from '../../src/logic/data-persistence';
import { UnbilledDealWithoutInvoice } from '../../src/logic/issue-reporting-coordination';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
  fetchOperationAuditLogsByRecord: jest.fn(),
}));
jest.mock('../../src/logic/modification-tracking.ts');
jest.mock('../../src/logic/audit-logging.ts');

describe('SCEN-249: 報告種別が unbilled で該当商談に請求書が全く存在しない場合に期待される請求内容の詳細が報告内容に含まれていないと UnbilledDealWithoutInvoice エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告種別が unbilled で商談に請求書が存在せず、reportContent に期待される請求内容の詳細が含まれている場合、成功して reportId とステータスが返される', async () => {
    const dealId = 'DEAL-20250107-001';
    const reportedBy = 'SALESPERSON-00123';
    const currentDateTime = new Date('2025-01-07T10:00:00Z');

    const mockDeal = {
      dealId,
      customerId: 'CUSTOMER-001',
      salesRepresentativeId: reportedBy,
      dealName: 'Test Deal',
      dealAmount: 500000,
      stageId: 'stage-closed_won',
      expectedContractDate: '2025-01-05',
      contractedDate: '2025-01-05',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-05',
      createdBy: reportedBy,
    };

    const reportContent = {
      reason: '請求書が発行されていない',
      expectedInvoiceDate: new Date('2025-01-05'),
      currentStatus: '未請求',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:00:00Z',
    });
    (dataPersistence.fetchOperationAuditLogsByRecord as jest.Mock).mockResolvedValue({
      operationLogs: [],
      totalCount: 0,
      fetchedAt: '2025-01-07T10:00:00Z',
    });

    const result = await submitIssueReport({
      dealId,
      issueType: 'unbilled',
      reportContent,
      reportedBy,
      currentDateTime,
    });

    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toMatch(/^.+$/);
    expect(result).toHaveProperty('dealId', dealId);
    expect(result).toHaveProperty('issueType', 'unbilled');
    expect(result).toHaveProperty('normalizedContent');
    expect(result.normalizedContent).toHaveProperty('reason', '請求書が発行されていない');
    expect(result.normalizedContent).toHaveProperty('expectedInvoiceDate');
    expect(result.normalizedContent).toHaveProperty('currentStatus', '未請求');
    expect(result).toHaveProperty('recordedAt');
    expect(result.recordedAt instanceof Date).toBe(true);
    expect(result).toHaveProperty('status', 'recorded');
  });
});
