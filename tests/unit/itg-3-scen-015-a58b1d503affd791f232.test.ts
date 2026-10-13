import { runTx5Imp1Agent, Tx5Imp1AiClient } from '../../src/agents/tx-5-imp-1/orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-015: NoDiscrepancyFoundError - 分析対象期間内に差異レコードが存在しない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoDiscrepancyFoundError when no discrepancy records exist in target period', async () => {
    const input = {
      executorUserId: 'user-sales-manager-001',
      discrepancyAnalysisContext: {
        analysisTimestamp: '2026-10-07T10:00:00Z',
        targetPeriodStart: '2026-10-01',
        targetPeriodEnd: '2026-10-07',
        includeExceptionPatterns: true,
      },
      notificationChannels: {
        accountingDepartmentEmail: 'accounting@company.com',
        salesSystemOwnerEmail: 'salesops@company.com',
        escalationEnabled: true,
      },
    };

    const mockAiClient: Tx5Imp1AiClient = {} as Tx5Imp1AiClient;

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue([]);

    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('NoDiscrepancyFoundError');
    await expect(runTx5Imp1Agent(input, mockAiClient)).rejects.toThrow('分析対象の差異が見つかりません。');
  });
});
