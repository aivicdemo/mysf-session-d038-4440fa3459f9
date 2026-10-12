import { runTx8Imp1Agent, Tx8Imp1AiClient, AnomalyDetectionFailed } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AgentInput } from '../../src/agents/tx-8-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-067: AnomalyDetectionFailed error when previous month report retrieval fails', () => {
  let mockAiClient: Tx8Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      callAction: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should throw AnomalyDetectionFailed error when fetchInvoicesForPeriod returns null', async () => {
    const input: Tx8Imp1AgentInput = {
      targetYearMonth: '2024-11',
      contractDataSource: {
        sourceDocument: '契約管理表_2024年11月版.xlsx',
        extractedAt: '2024-11-01T09:00:00Z',
        extractedBy: 'system',
      },
      vendorMaintenanceFeeSource: {
        vendor: 'TechVendor Inc.',
        providedAt: '2024-11-01T10:30:00Z',
        format: 'CSV',
      },
      itMonitoringToolCostSource: {
        toolName: 'Datadog',
        linkedSystem: 'Production Infrastructure',
        costDepartment: 'IT Operations',
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
          vendor: 'TechVendor Inc.',
          product: 'Database Support',
          annualMaintenanceFee: 200000,
          contractPeriod: '2024-01-01～2024-12-31',
        },
      ],
      extractedMonitoringToolCostData: [
        {
          toolName: 'Datadog',
          linkedSystem: 'Production Infrastructure',
          monthlyCost: 15000,
          costDepartment: 'IT Operations',
        },
      ],
    };

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(null);

    await expect(runTx8Imp1Agent(input, mockAiClient)).rejects.toThrow(AnomalyDetectionFailed);
  });
});
