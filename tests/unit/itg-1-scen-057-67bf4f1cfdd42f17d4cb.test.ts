import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-057: 契約書・管理表とベンダー・IT部門から正常に抽出されたライセンス・保守費用・監視ツール費用を統一フォーマットで集約し、前月との差異がない場合は空配列で月次レポートを生成する', () => {
  const mockFetchInvoicesForPeriod = dataPersistence.fetchInvoicesForPeriod as jest.Mock;

  const mockAiClient: Tx8Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchInvoicesForPeriod.mockResolvedValue({
      reportId: 'prev-2024-10-uuid-12345',
      targetYearMonth: '2024-10',
      aggregatedCostData: {
        totalLicenseCost: 550000,
        totalMaintenanceFee: 110000,
        totalMonitoringToolCost: 480000,
        grandTotal: 1140000,
      },
    });
  });

  it('should generate monthly report with empty anomalies when no difference is detected', async () => {
    const input = {
      targetYearMonth: '2024-11',
      contractDataSource: {
        sourceDocument: '契約書管理表_2024年11月版.xlsx',
        extractedAt: '2024-11-01T09:00:00Z',
        extractedBy: 'system_user_001',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'TechVendor Corp',
        providedAt: '2024-11-05T14:30:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'CloudWatch',
        linkedSystem: 'AWS_Infrastructure',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Enterprise_Suite',
          userCount: 150,
          annualCost: 450000,
          extractedAt: '2024-11-01T09:00:00Z',
        },
        {
          licenseType: 'Development_Tools',
          userCount: 50,
          annualCost: 100000,
          extractedAt: '2024-11-01T09:00:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'TechVendor Corp',
          product: 'Enterprise_Suite',
          annualMaintenanceFee: 90000,
          contractPeriod: '2024-11-01~2025-10-31',
        },
        {
          vendor: 'DevTool Solutions',
          product: 'Development_Tools',
          annualMaintenanceFee: 20000,
          contractPeriod: '2024-11-01~2025-10-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'CloudWatch',
          linkedSystem: 'AWS_Infrastructure',
          monthlyCost: 15000,
          costDepartment: 'IT_Operations',
        },
        {
          toolName: 'DatadogMonitor',
          linkedSystem: 'Application_Performance',
          monthlyCost: 25000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toMatchObject({
      reportId: expect.any(String),
      targetYearMonth: '2024-11',
      aggregatedCostData: {
        totalLicenseCost: 550000,
        totalMaintenanceFee: 110000,
        totalMonitoringToolCost: 480000,
        grandTotal: 1140000,
      },
      detectedAnomalies: [],
      monthlyReport: expect.objectContaining({
        generatedAt: expect.any(String),
        reportContent: expect.any(String),
        format: expect.stringMatching(/json|text/),
      }),
      status: 'success',
      errorDetails: null,
    });

    expect(mockFetchInvoicesForPeriod).toHaveBeenCalled();
  });
});
