import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-064: ベンダー保守費用情報の各項目（ベンダー名、保守対象製品、年間保守費用）に不正な値が含まれている場合、MaintenanceFeeDataValidationFailedエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw MaintenanceFeeDataValidationFailed error when vendor name is empty', async () => {
    const input = {
      targetYearMonth: '2024-01',
      contractDataSource: {
        sourceDocument: '契約管理表_2024-01.xlsx',
        extractedAt: '2024-01-15T10:30:00Z',
        extractedBy: 'automated_extraction_service',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'Vendor_A',
        providedAt: '2024-01-10T09:00:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'Production_Infrastructure',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Enterprise_License',
          userCount: 50,
          annualCost: 150000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: '',
          product: 'Product_X',
          annualMaintenanceFee: 25000,
          contractPeriod: '2024-01-01/2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'Production_Infrastructure',
          monthlyCost: 5000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'MaintenanceFeeDataValidationFailed',
        message: expect.stringContaining('保守費用情報の値が不正です'),
      })
    );
  });
});
