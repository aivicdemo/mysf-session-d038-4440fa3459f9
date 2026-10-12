import { runTx9Imp1Agent, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as tcoEstimation from '../../src/logic/tco-estimation';

jest.mock('../../src/logic/tco-estimation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/tco-estimation')>('../../src/logic/tco-estimation'),
  estimateTCOForMigrationCandidates: jest.fn(),
}));

describe('SCEN-071: 複数のシステム候補について、ライセンス費用と保守費用から3年間TCOを試算し、年別内訳を含む結果を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return TCO estimation results for multiple candidates with yearly breakdown', async () => {
    const input: any = {
      migrationCandidates: [
        {
          candidateId: 'CAND-001',
          candidateName: 'Microsoft Dynamics 365',
          systemType: 'CRM',
          description: 'クラウドベースのCRM',
        },
        {
          candidateId: 'CAND-002',
          candidateName: 'Zoho CRM',
          systemType: 'CRM',
          description: '低コストCRM',
        },
        {
          candidateId: 'CAND-003',
          candidateName: 'Oracle Cloud CRM',
          systemType: 'CRM',
          description: '統合プラットフォーム',
        },
      ],
      currentDateTime: new Date('2025-07-15T10:30:00Z'),
      executionContext: {
        userId: 'USER-001',
        userRole: 'SYSTEM_ADMIN',
        organizationId: 'ORG-001',
        sessionId: 'SESSION-20250715-001',
      },
    };

    const mockOutput = {
      licenseMetricsForCandidates: {
        candidates: [
          {
            candidateId: 'CAND-001',
            candidateName: 'Microsoft Dynamics 365',
            licenseType: 'USER_BASED',
            userCount: 50,
            annualLicenseCost: 300000,
            maintenanceCostPerYear: 45000,
          },
          {
            candidateId: 'CAND-002',
            candidateName: 'Zoho CRM',
            licenseType: 'USER_BASED',
            userCount: 50,
            annualLicenseCost: 150000,
            maintenanceCostPerYear: 22500,
          },
          {
            candidateId: 'CAND-003',
            candidateName: 'Oracle Cloud CRM',
            licenseType: 'USER_BASED',
            userCount: 50,
            annualLicenseCost: 200000,
            maintenanceCostPerYear: 30000,
          },
        ],
      },
      threeYearTCOBaseline: {
        tcoResults: [
          {
            candidateId: 'CAND-001',
            candidateName: 'Microsoft Dynamics 365',
            annualLicenseCost: 300000,
            maintenanceCost: 45000,
            threeYearTCO: 1035000,
            costBreakdown: {
              year1: 345000,
              year2: 345000,
              year3: 345000,
            },
          },
          {
            candidateId: 'CAND-002',
            candidateName: 'Zoho CRM',
            annualLicenseCost: 150000,
            maintenanceCost: 22500,
            threeYearTCO: 517500,
            costBreakdown: {
              year1: 172500,
              year2: 172500,
              year3: 172500,
            },
          },
          {
            candidateId: 'CAND-003',
            candidateName: 'Oracle Cloud CRM',
            annualLicenseCost: 200000,
            maintenanceCost: 30000,
            threeYearTCO: 690000,
            costBreakdown: {
              year1: 230000,
              year2: 230000,
              year3: 230000,
            },
          },
        ],
      },
      tcoAnomalousValues: [],
    };

    (tcoEstimation.estimateTCOForMigrationCandidates as jest.Mock).mockResolvedValue(mockOutput);

    const result = await runTx9Imp1Agent(input, {} as any);

    expect(result.status).toBe('success');
    expect(result.tcoEstimationResults).toHaveLength(3);

    expect(result.tcoEstimationResults[0]).toEqual({
      candidateId: 'CAND-001',
      candidateName: 'Microsoft Dynamics 365',
      annualLicenseCost: 300000,
      maintenanceCost: 45000,
      threeYearTCO: 1035000,
      costBreakdown: {
        year1: 345000,
        year2: 345000,
        year3: 345000,
      },
    });

    expect(result.tcoEstimationResults[1]).toEqual({
      candidateId: 'CAND-002',
      candidateName: 'Zoho CRM',
      annualLicenseCost: 150000,
      maintenanceCost: 22500,
      threeYearTCO: 517500,
      costBreakdown: {
        year1: 172500,
        year2: 172500,
        year3: 172500,
      },
    });

    expect(result.tcoEstimationResults[2]).toEqual({
      candidateId: 'CAND-003',
      candidateName: 'Oracle Cloud CRM',
      annualLicenseCost: 200000,
      maintenanceCost: 30000,
      threeYearTCO: 690000,
      costBreakdown: {
        year1: 230000,
        year2: 230000,
        year3: 230000,
      },
    });

    expect(result.anomalousValues).toEqual([]);

    expect(result.dataCollectionSummary.totalCandidatesProcessed).toBe(3);
    expect(result.dataCollectionSummary.successfulCollections).toBe(3);
    expect(result.dataCollectionSummary.failedCollections).toBe(0);

    expect(result.executionLog.length).toBeGreaterThan(0);
    expect(result.executionLog[0].status).toBe('success');

    expect(result.errorDetails).toBeNull();
  });
});
