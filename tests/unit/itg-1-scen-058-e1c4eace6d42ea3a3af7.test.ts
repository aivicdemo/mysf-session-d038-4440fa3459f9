import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-058: 対象年月がYYYY-MM形式でない、または存在しない年月である場合、InvalidTargetYearMonthFormatエラーで処理を中止する', () => {
  const mockAiClient: Tx8Imp1AiClient = {};

  it('should throw InvalidTargetYearMonthFormat error when targetYearMonth is invalid (2024-13)', async () => {
    const input = {
      targetYearMonth: '2024-13',
      contractDataSource: {
        sourceDocument: '契約書マスタ_2024',
        extractedAt: '2024-01-15T10:30:00Z',
        extractedBy: 'system',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'VendorA',
        providedAt: '2024-01-10T09:00:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'MonitoringTool1',
        linkedSystem: 'ERP',
        costDepartment: 'IT部門',
      },
      extractedLicenseData: [
        {
          licenseType: 'Standard',
          userCount: 50,
          annualCost: 500000,
          extractedAt: '2024-01-15T10:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'VendorA',
          product: 'ProductX',
          annualMaintenanceFee: 200000,
          contractPeriod: '2024-01-01〜2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'MonitoringTool1',
          linkedSystem: 'ERP',
          monthlyCost: 50000,
          costDepartment: 'IT部門',
        },
      ],
    };

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(
      expect.objectContaining({
        name: 'InvalidTargetYearMonthFormat',
        message: expect.stringContaining('対象年月の形式が不正です'),
      })
    );
  });
});
