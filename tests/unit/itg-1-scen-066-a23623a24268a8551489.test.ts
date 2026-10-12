import { runTx8Imp1Agent, Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('SCEN-066: ライセンス情報、保守費用、監視ツール費用が統一フォーマットに変換できない場合、DataFormatInconsistencyエラーで処理を中止する', () => {
  it('vendorMaintenanceFeeSource.format=\'invalid_format\'、またはextractedMonitoringToolCostData.monthlyCostが数値でない場合、DataFormatInconsistencyエラーが発生し、statusが\'failed\'となる', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      validateAndConvertToUnifiedFormat: jest.fn().mockRejectedValue({
        errorCode: 'DataFormatInconsistency',
        errorMessage: 'データフォーマットの統一に失敗しました。各データソースの形式を確認してください。',
        affectedDataSource: 'extractedMaintenanceFeeData, extractedMonitoringToolCostData',
      }),
    };

    const input = {
      targetYearMonth: '2024-11',
      contractDataSource: {
        sourceDocument: '契約書_2024-11.pdf',
        extractedAt: '2024-11-01T10:00:00Z',
        extractedBy: 'automated_system',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'VendorA',
        providedAt: '2024-11-05T14:30:00Z',
        format: 'invalid_format',
      },
      itMonitoringToolCostSource: {
        toolName: 'MonitoringTool_X',
        linkedSystem: 'System_Y',
        costDepartment: 'IT_Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Enterprise',
          userCount: 100,
          annualCost: 500000,
          extractedAt: '2024-11-01T10:00:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'VendorA',
          product: 'ProductX',
          annualMaintenanceFee: 150000,
          contractPeriod: '2024-01-01/2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'MonitoringTool_X',
          linkedSystem: 'System_Y',
          monthlyCost: 25000,
          costDepartment: 'IT_Operations',
        },
      ],
    };

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('failed');
    expect(result.errorDetails).toBeDefined();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    expect(result.errorDetails.length).toBeGreaterThan(0);

    const errorDetail = result.errorDetails[0];
    expect(errorDetail.errorCode).toBe('DataFormatInconsistency');
    expect(errorDetail.errorMessage).toBe('データフォーマットの統一に失敗しました。各データソースの形式を確認してください。');
    expect(errorDetail.affectedDataSource).toContain('extractedMaintenanceFeeData');
    expect(errorDetail.affectedDataSource).toContain('extractedMonitoringToolCostData');

    expect(result.reportId).toBeNull();
    expect(result.aggregatedCostData).toBeNull();
    expect(result.detectedAnomalies).toBeNull();
    expect(result.monthlyReport).toBeNull();
  });
});
