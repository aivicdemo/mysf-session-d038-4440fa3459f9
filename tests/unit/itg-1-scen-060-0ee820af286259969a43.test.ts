import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-060: 抽出されたベンダー保守費用情報が空配列またはnullの場合、MissingMaintenanceFeeDataエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw MissingMaintenanceFeeData error when extractedMaintenanceFeeData is null', async () => {
    const input = {
      targetYearMonth: '2024-11',
      contractDataSource: {
        sourceDocument: 'contract_2024_master.xlsx',
        extractedAt: '2024-11-01T09:00:00Z',
        extractedBy: 'system_user',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'Microsoft',
        providedAt: '2024-11-05T14:30:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'production_infrastructure',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Office365_E5',
          userCount: 150,
          annualCost: 2250000,
          extractedAt: '2024-11-01T09:15:00Z',
        },
      ],
      extractedMaintenanceFeeData: null,
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'production_infrastructure',
          monthlyCost: 150000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'MissingMaintenanceFeeData',
        message: expect.stringContaining('ベンダーから保守費用情報を抽出できませんでした'),
      })
    );
  });
});
