import { runTx8Imp1Agent, Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AgentInput } from '../../src/agents/tx-8-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-070: Partial success with validation failures and error details', () => {
  let mockAiClient: Tx8Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      callAction: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return partial_success status with aggregated valid data and error details for invalid entries', async () => {
    const input: Tx8Imp1AgentInput = {
      targetYearMonth: '2025-01',
      contractDataSource: {
        sourceDocument: 'contract_2024_Q4.pdf',
        extractedAt: '2025-01-05T10:30:00Z',
        extractedBy: 'automation_service',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'Microsoft',
        providedAt: '2025-01-02T08:00:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'production_monitoring',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Office365_E5',
          userCount: 150,
          annualCost: 450000,
          extractedAt: '2025-01-05T10:30:00Z',
        },
        {
          licenseType: 'Adobe_CC',
          userCount: 50,
          annualCost: 300000,
          extractedAt: '2025-01-05T10:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'Microsoft',
          product: 'SQL_Server_2022',
          annualMaintenanceFee: 200000,
          contractPeriod: '2025-01-01~2025-12-31',
        },
        {
          vendor: 'Oracle',
          product: 'Database_Enterprise',
          annualMaintenanceFee: null,
          contractPeriod: '2025-01-01~2025-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'production_monitoring',
          monthlyCost: 50000,
          costDepartment: 'IT_Operations',
        },
        {
          toolName: 'New_Relic',
          linkedSystem: 'application_performance',
          monthlyCost: -10000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          reportId: 'report-2024-12',
          targetYearMonth: '2024-12',
          aggregatedCostData: {
            totalLicenseCost: 700000,
            totalMaintenanceFee: 180000,
            totalMonitoringToolCost: 480000,
            grandTotal: 1360000,
          },
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-12-31T23:59:59Z',
    });

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('partial_success');
    expect(result.reportId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.targetYearMonth).toBe('2025-01');

    expect(result.aggregatedCostData.totalLicenseCost).toBe(750000);
    expect(result.aggregatedCostData.totalMaintenanceFee).toBe(200000);
    expect(result.aggregatedCostData.totalMonitoringToolCost).toBe(600000);
    expect(result.aggregatedCostData.grandTotal).toBe(1550000);

    expect(result.monthlyReport.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.monthlyReport.reportContent).toBeDefined();

    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toBeInstanceOf(Array);
    if (result.errorDetails) {
      const maintenanceError = result.errorDetails.find((e) => e.errorCode === 'MaintenanceFeeDataValidationFailed');
      expect(maintenanceError).toBeDefined();
      if (maintenanceError) {
        expect(maintenanceError.errorMessage).toBe('保守費用情報の値が不正です。ベンダー名、保守対象製品、年間保守費用を確認してください。');
        expect(maintenanceError.affectedDataSource).toBe('extractedMaintenanceFeeData');
      }

      const toolCostError = result.errorDetails.find((e) => e.errorCode === 'MonitoringToolCostDataValidationFailed');
      expect(toolCostError).toBeDefined();
      if (toolCostError) {
        expect(toolCostError.errorMessage).toBe('監視ツール連携費用の値が不正です。ツール名、連携対象、月額費用を確認してください。');
        expect(toolCostError.affectedDataSource).toBe('extractedMonitoringToolCostData');
      }
    }
  });
});
