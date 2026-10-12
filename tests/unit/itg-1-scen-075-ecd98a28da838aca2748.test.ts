import { runTx9Imp1Agent, IncompleteLicenseData, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as tcoEstimation from '../../src/logic/tco-estimation';

jest.mock('../../src/logic/tco-estimation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/tco-estimation')>('../../src/logic/tco-estimation'),
  estimateTCOForMigrationCandidates: jest.fn(),
}));

describe('SCEN-075: 候補システムの一部のライセンス情報が欠落している場合、IncompleteLicenseDataエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw IncompleteLicenseData error when license metrics for one candidate is null', async () => {
    const input: any = {
      migrationCandidates: [
        {
          candidateId: 'cand-001',
          candidateName: 'Oracle EBS',
          systemType: 'ERP',
          description: 'Oracle Enterprise Business Suite',
        },
        {
          candidateId: 'cand-002',
          candidateName: 'SAP S/4HANA',
          systemType: 'ERP',
          description: 'SAP Sales and Distribution Module',
        },
      ],
      currentDateTime: new Date('2025-06-15T10:30:00Z'),
      executionContext: {
        userId: 'user-12345',
        userRole: 'system_admin',
        organizationId: 'org-789',
        sessionId: 'session-abcde-99999',
      },
    };

    const mockOutput = {
      licenseMetricsForCandidates: {
        'cand-001': {
          annualLicenseCost: 500000,
          maintenanceCost: 50000,
        },
        'cand-002': null,
      },
    };

    (tcoEstimation.estimateTCOForMigrationCandidates as jest.Mock).mockResolvedValue(mockOutput);

    await expect(runTx9Imp1Agent(input, {} as any)).rejects.toThrow(IncompleteLicenseData);
  });
});
