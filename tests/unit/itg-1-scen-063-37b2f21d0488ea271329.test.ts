import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-063: ライセンス情報の年間費用が負の値である場合、LicenseDataValidationFailedエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw LicenseDataValidationFailed error when annual cost is negative', async () => {
    const input = {
      targetYearMonth: '2024-01',
      contractDataSource: {
        sourceDocument: '契約管理表_2024年1月.xlsx',
        extractedAt: '2024-01-15T10:30:00Z',
        extractedBy: 'system_admin',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'Oracle',
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
          licenseType: 'Microsoft365',
          userCount: 100,
          annualCost: -50000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
        {
          licenseType: 'Adobe Creative Cloud',
          userCount: 50,
          annualCost: 120000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'Oracle',
          product: 'Oracle Database 21c',
          annualMaintenanceFee: 300000,
          contractPeriod: '2024-01-01～2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'Production Environment',
          monthlyCost: 50000,
          costDepartment: 'IT Operations',
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
