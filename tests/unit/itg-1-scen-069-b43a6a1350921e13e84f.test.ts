import { runTx8Imp1Agent, Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AgentInput } from '../../src/agents/tx-8-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-069: Detect license cost variance and generate monthly report with anomaly', () => {
  let mockAiClient: Tx8Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      callAction: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should detect LICENSE_COST_VARIANCE anomaly and return success status with report', async () => {
    const input: Tx8Imp1AgentInput = {
      targetYearMonth: '2024-11',
      contractDataSource: {
        sourceDocument: '契約管理表_2024-11.xlsx',
        extractedAt: '2024-11-01T09:30:00Z',
        extractedBy: 'system',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'vendor-001',
        providedAt: '2024-11-05T14:00:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'Production Environment',
        costDepartment: 'IT Operations',
      },
      extractedLicenseData: [
        {
          licenseType: 'Office365_E3',
          userCount: 150,
          annualCost: 1800000,
          extractedAt: '2024-11-01T09:30:00Z',
        },
        {
          licenseType: 'Adobe_CreativeCloud',
          userCount: 25,
          annualCost: 750000,
          extractedAt: '2024-11-01T09:30:00Z',
        },
      ],
      extractedMaintenanceFeeData: [
        {
          vendor: 'vendor-001',
          product: 'RHEL_Premium_Support',
          annualMaintenanceFee: 500000,
          contractPeriod: '2024-01-01 to 2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'Production Environment',
          monthlyCost: 100000,
          costDepartment: 'IT Operations',
        },
      ],
    };

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          reportId: 'rpt-2024-10-abc123',
          targetYearMonth: '2024-10',
          aggregatedCostData: {
            totalLicenseCost: 2450000,
            totalMaintenanceFee: 500000,
            totalMonitoringToolCost: 1200000,
            grandTotal: 4150000,
          },
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('success');
    expect(result.reportId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.targetYearMonth).toBe('2024-11');
    expect(result.aggregatedCostData.totalLicenseCost).toBe(2550000);
    expect(result.aggregatedCostData.totalMaintenanceFee).toBe(500000);
    expect(result.aggregatedCostData.totalMonitoringToolCost).toBe(1200000);
    expect(result.aggregatedCostData.grandTotal).toBe(4250000);

    expect(result.detectedAnomalies.length).toBe(1);
    const licenseAnomaly = result.detectedAnomalies[0];
    expect(licenseAnomaly.anomalyType).toBe('LICENSE_COST_VARIANCE');
    expect(licenseAnomaly.description).toBe('ライセンス費用が前月比で変動している');
    expect(licenseAnomaly.previousValue).toBe(2450000);
    expect(licenseAnomaly.currentValue).toBe(2550000);
    expect(licenseAnomaly.differencePercentage).toBeCloseTo(4.08, 1);

    expect(result.monthlyReport.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(['pdf', 'json']).toContain(result.monthlyReport.format.toLowerCase());
    expect(result.monthlyReport.reportContent).toContain('2024-11');
    expect(result.errorDetails).toBeNull();
  });
});
