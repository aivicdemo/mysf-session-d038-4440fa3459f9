import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-059: 抽出されたライセンス情報が空配列またはnullの場合、MissingLicenseDataSourceエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw MissingLicenseDataSource error when extractedLicenseData is null', async () => {
    const input = {
      targetYearMonth: '2024-01',
      contractDataSource: {
        sourceDocument: 'contract_master_2024.xlsx',
        extractedAt: '2024-01-15T10:30:00Z',
        extractedBy: 'system_user_001',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'Microsoft',
        providedAt: '2024-01-10T09:00:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'production_infrastructure',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: null,
      extractedMaintenanceFeeData: [
        {
          vendor: 'Microsoft',
          product: 'Office 365',
          annualMaintenanceFee: 150000,
          contractPeriod: '2024-01-01 to 2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'production_infrastructure',
          monthlyCost: 5000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'MissingLicenseDataSource',
        message: expect.stringContaining('契約書・管理表からライセンス情報を抽出できませんでした'),
      })
    );
  });
});
