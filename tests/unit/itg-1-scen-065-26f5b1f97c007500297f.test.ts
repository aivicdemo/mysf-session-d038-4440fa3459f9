import { runTx8Imp1Agent, Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-065: MonitoringToolCostDataValidationFailed error when invalid monitoring tool cost data', () => {
  it('should return failed status with MonitoringToolCostDataValidationFailed error details when monthlyCost is negative', async () => {
    const mockAiClient: Tx8Imp1AiClient = {};

    const input = {
      targetYearMonth: '2024-11',
      contractDataSource: {
        sourceDocument: 'contract_20241101.pdf',
        extractedAt: '2024-11-01T09:00:00Z',
        extractedBy: 'system_extractor',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'vendor_a',
        providedAt: '2024-11-01T10:30:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'monitoring_tool_1',
        linkedSystem: 'system_prod',
        costDepartment: 'IT-Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Enterprise',
          userCount: 150,
          annualCost: 450000,
          extractedAt: '2024-11-01T09:15:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'vendor_a',
          product: 'product_maintenance_service',
          annualMaintenanceFee: 180000,
          contractPeriod: '2024-01-01 to 2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'monitoring_tool_1',
          linkedSystem: 'system_prod',
          monthlyCost: -5000,
          costDepartment: 'IT-Operations',
        },
      ],
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('failed');
    expect(result.errorDetails).not.toBeNull();
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.[0].errorCode).toBe('MonitoringToolCostDataValidationFailed');
    expect(result.errorDetails?.[0].errorMessage).toBe('監視ツール連携費用の値が不正です。ツール名、連携対象、月額費用を確認してください。');
    expect(result.errorDetails?.[0].affectedDataSource).toBe('itMonitoringToolCostSource');
    expect(result.reportId).toBeUndefined();
    expect(result.aggregatedCostData).toBeUndefined();
    expect(result.detectedAnomalies).toBeUndefined();
    expect(result.monthlyReport).toBeUndefined();
  });
});
