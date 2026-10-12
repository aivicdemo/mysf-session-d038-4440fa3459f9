import { runTx9Imp1Agent, TCOCalculationFailed, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as tcoEstimation from '../../src/logic/tco-estimation';

jest.mock('../../src/logic/tco-estimation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/tco-estimation')>('../../src/logic/tco-estimation'),
  estimateTCOForMigrationCandidates: jest.fn(),
}));

describe('SCEN-076: 3年間TCO試算の計算処理が失敗してthreeYearTCOBaselineがnullまたはundefinedの場合、TCOCalculationFailedエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw TCOCalculationFailed error when threeYearTCOBaseline is null', async () => {
    const input: any = {
      migrationCandidates: [
        {
          candidateId: 'CAND-001',
          candidateName: 'CRM System A',
          systemType: 'CRM',
          description: 'Customer relationship management system',
        },
        {
          candidateId: 'CAND-002',
          candidateName: 'ERP System B',
          systemType: 'ERP',
          description: 'Enterprise resource planning system',
        },
      ],
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
      executionContext: {
        userId: 'USER-001',
        userRole: 'SYSTEM_ADMIN',
        organizationId: 'ORG-001',
        sessionId: 'SESSION-abc123',
      },
    };

    const mockOutput = {
      licenseMetricsForCandidates: [
        {
          candidateId: 'CAND-001',
          annualLicenseCost: 150000,
          maintenanceCost: 30000,
          userCount: 50,
        },
        {
          candidateId: 'CAND-002',
          annualLicenseCost: 200000,
          maintenanceCost: 40000,
          userCount: 75,
        },
      ],
      threeYearTCOBaseline: null,
      tcoAnomalousValues: [],
    };

    (tcoEstimation.estimateTCOForMigrationCandidates as jest.Mock).mockResolvedValue(mockOutput);

    await expect(runTx9Imp1Agent(input, {} as any)).rejects.toThrow(TCOCalculationFailed);
  });
});
