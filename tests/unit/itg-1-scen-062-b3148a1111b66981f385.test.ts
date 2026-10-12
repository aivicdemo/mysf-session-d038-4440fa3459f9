import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-062: ライセンス情報の各項目（ライセンス種別、ユーザー数、年間費用）に不正な値が含まれている場合、LicenseDataValidationFailedエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw LicenseDataValidationFailed error when license type is empty and user count is negative', async () => {
    const input = {
      targetYearMonth: '2024-01',
      contractDataSource: {
        sourceDocument: 'contract_2024_001.pdf',
        extractedAt: '2024-01-15T10:30:00Z',
        extractedBy: 'system_user',
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
      extractedLicenseData: [
        {
          licenseType: '',
          userCount: -5,
          annualCost: 50000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'Microsoft',
          product: 'Office365',
          annualMaintenanceFee: 120000,
          contractPeriod: '2024-01-01/2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'production_infrastructure',
          monthlyCost: 15000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'LicenseDataValidationFailed',
        message: expect.stringContaining('ライセンス情報の値が不正です'),
      })
    );
  });
});
