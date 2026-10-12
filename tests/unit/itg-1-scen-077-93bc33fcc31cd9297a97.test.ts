import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-077: TCO試算に異常値が検出された場合、statusをpartial_successとし、anomalousValuesに異常値の種別・検出値・期待範囲・重要度を含めて返す', () => {
  it('should return partial_success status with anomalous values included', async () => {
    const migrationCandidates = [
      { candidateId: 'CAND-001', candidateName: 'Oracle Cloud ERP', systemType: 'ERP' },
      { candidateId: 'CAND-002', candidateName: 'Microsoft Dynamics 365', systemType: 'CRM' }
    ];
    const currentDateTime = new Date('2024-01-15T10:30:00Z');
    const executionContext = {
      userId: 'USR-12345',
      userRole: 'finance_manager',
      organizationId: 'ORG-001',
      sessionId: 'SESSION-ABC123'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockResolvedValue({
        licenseMetricsForCandidates: [
          {
            candidateId: 'CAND-001',
            candidateName: 'Oracle Cloud ERP',
            annualLicenseCost: 500000,
            maintenanceCost: 50000,
            userCount: 150
          },
          {
            candidateId: 'CAND-002',
            candidateName: 'Microsoft Dynamics 365',
            annualLicenseCost: -100000,
            maintenanceCost: 30000,
            userCount: 200
          }
        ],
        threeYearTCOBaseline: [
          {
            candidateId: 'CAND-001',
            candidateName: 'Oracle Cloud ERP',
            year1: 550000,
            year2: 600000,
            year3: 650000,
            threeYearTCO: 1800000
          },
          {
            candidateId: 'CAND-002',
            candidateName: 'Microsoft Dynamics 365',
            year1: -70000,
            year2: 360000,
            year3: 390000,
            threeYearTCO: 680000
          }
        ],
        tcoAnomalousValues: [
          {
            candidateId: 'CAND-002',
            candidateName: 'Microsoft Dynamics 365',
            anomalyType: 'negative_value',
            detectedValue: -100000,
            expectedRange: { min: 0, max: 1000000 },
            severity: 'high'
          },
          {
            candidateId: 'CAND-002',
            candidateName: 'Microsoft Dynamics 365',
            anomalyType: 'year1_deficit',
            detectedValue: -70000,
            expectedRange: { min: 100000, max: 800000 },
            severity: 'critical'
          }
        ]
      })
    };

    jest.mock('../../src/logic/tco-estimation', () => ({
      ...jest.requireActual<typeof import('../../src/logic/tco-estimation')>('../../src/logic/tco-estimation'),
      estimateTCOForMigrationCandidates: jest.fn()
    }), { virtual: true });

    const result = await runTx9Imp1Agent(
      {
        migrationCandidates,
        currentDateTime,
        executionContext
      },
      mockAiClient
    );

    expect(result.status).toBe('partial_success');
    expect(result.tcoEstimationResults).toHaveLength(2);
    expect(result.tcoEstimationResults[0]).toEqual({
      candidateId: 'CAND-001',
      candidateName: 'Oracle Cloud ERP',
      annualLicenseCost: 500000,
      maintenanceCost: 50000,
      threeYearTCO: 1800000,
      costBreakdown: { year1: 550000, year2: 600000, year3: 650000 }
    });
    expect(result.tcoEstimationResults[1]).toEqual({
      candidateId: 'CAND-002',
      candidateName: 'Microsoft Dynamics 365',
      annualLicenseCost: -100000,
      maintenanceCost: 30000,
      threeYearTCO: 680000,
      costBreakdown: { year1: -70000, year2: 360000, year3: 390000 }
    });

    expect(result.anomalousValues).toHaveLength(2);
    expect(result.anomalousValues[0]).toEqual({
      candidateId: 'CAND-002',
      candidateName: 'Microsoft Dynamics 365',
      anomalyType: 'negative_value',
      detectedValue: -100000,
      expectedRange: { min: 0, max: 1000000 },
      severity: 'high'
    });
    expect(result.anomalousValues[1]).toEqual({
      candidateId: 'CAND-002',
      candidateName: 'Microsoft Dynamics 365',
      anomalyType: 'year1_deficit',
      detectedValue: -70000,
      expectedRange: { min: 100000, max: 800000 },
      severity: 'critical'
    });

    expect(result.dataCollectionSummary.totalCandidatesProcessed).toBe(2);
    expect(result.dataCollectionSummary.successfulCollections).toBe(2);
    expect(result.dataCollectionSummary.failedCollections).toBe(0);

    expect(result.executionLog).toBeDefined();
    expect(result.executionLog.length).toBeGreaterThan(0);
    result.executionLog.forEach((log) => {
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(typeof log.step).toBe('string');
      expect(['running', 'success', 'failed']).toContain(log.status);
    });

    expect(result.errorDetails).toBeNull();
  });
});
