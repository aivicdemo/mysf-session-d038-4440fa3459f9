import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-061: 抽出されたIT部門監視ツール連携費用が空配列またはnullの場合、MissingMonitoringToolCostDataエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw MissingMonitoringToolCostData error when extractedMonitoringToolCostData is null', async () => {
    const input = {
      targetYearMonth: '2024-01',
      contractDataSource: {
        sourceDocument: 'contract_2024_01.pdf',
        extractedAt: '2024-01-15T10:00:00Z',
        extractedBy: 'system_user',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'TechVendor Inc',
        providedAt: '2024-01-10T09:00:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'Production Environment',
        costDepartment: 'IT Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Enterprise',
          userCount: 50,
          annualCost: 500000,
          extractedAt: '2024-01-15T10:00:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'TechVendor Inc',
          product: 'ProductA',
          annualMaintenanceFee: 150000,
          contractPeriod: '2024-01-01 to 2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: null,
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'MissingMonitoringToolCostData',
        message: expect.stringContaining('IT部門から監視ツール連携費用を抽出できませんでした'),
      })
    );
  });
});
