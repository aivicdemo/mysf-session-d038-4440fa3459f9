import { runTx8Imp1Agent, Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AgentInput } from '../../src/agents/tx-8-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-068: ReportGenerationFailed error when aggregated data cannot be generated', () => {
  let mockAiClient: Tx8Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      callAction: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return failed status with ReportGenerationFailed error details', async () => {
    const input: Tx8Imp1AgentInput = {
      targetYearMonth: '2024-01',
      contractDataSource: {
        sourceDocument: 'contract_2024_01.pdf',
        extractedAt: '2024-01-15T10:30:00Z',
        extractedBy: 'system_user',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'TechVendor Inc',
        providedAt: '2024-01-10T08:00:00Z',
        format: 'csv',
      },
      itMonitoringToolCostSource: {
        toolName: 'MonitoringTool Pro',
        linkedSystem: 'ERP_System',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Enterprise_License',
          userCount: 100,
          annualCost: 50000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
        {
          licenseType: 'Standard_License',
          userCount: 50,
          annualCost: 20000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'TechVendor Inc',
          product: 'MaintenanceProduct_A',
          annualMaintenanceFee: 15000,
          contractPeriod: '2024-01-01 to 2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'MonitoringTool Pro',
          linkedSystem: 'ERP_System',
          monthlyCost: 5000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    const previousMonthReport = {
      reportId: 'prev-report-uuid-2023-12',
      targetYearMonth: '2023-12',
      aggregatedCostData: {
        totalLicenseCost: 68000,
        totalMaintenanceFee: 15000,
        totalMonitoringToolCost: 60000,
        grandTotal: 143000,
      },
      detectedAnomalies: [],
      monthlyReport: {
        generatedAt: '2023-12-31T23:59:59Z',
        reportContent: 'December 2023 report content',
        format: 'JSON',
      },
      status: 'success',
      errorDetails: null,
    };

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [],
      totalCount: 1,
      fetchedAt: '2023-12-31T23:59:59Z',
    });

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('failed');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toBeInstanceOf(Array);
    if (result.errorDetails) {
      const reportGenError = result.errorDetails.find((e) => e.errorCode === 'ReportGenerationFailed');
      expect(reportGenError).toBeDefined();
      if (reportGenError) {
        expect(reportGenError.errorMessage).toBe('月次レポートの生成に失敗しました。集約データを確認してください。');
        expect(['extractedLicenseData', 'extractedMaintenanceFeeData', 'extractedMonitoringToolCostData']).toContain(
          reportGenError.affectedDataSource
        );
      }
    }
    expect(result.reportId).toBeUndefined();
    expect(result.monthlyReport).toBeUndefined();
  });
});
