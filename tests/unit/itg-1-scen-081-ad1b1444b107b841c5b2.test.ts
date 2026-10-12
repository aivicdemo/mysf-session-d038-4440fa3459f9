import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-081: 処理完了時に、データ収集サマリーとして処理件数・成功数・失敗数・所要時間を返す', () => {
  it('should return data collection summary with counts and duration', async () => {
    const migrationCandidates = [
      { candidateId: 'SYS-001', candidateName: 'Salesforce Alternative A', systemType: 'CRM' },
      { candidateId: 'SYS-002', candidateName: 'Open Source CRM B', systemType: 'CRM' },
      { candidateId: 'SYS-003', candidateName: 'Cloud ERP C', systemType: 'ERP' }
    ];
    const currentDateTime = new Date('2025-01-15T10:30:00Z');
    const executionContext = {
      userId: 'USR-12345',
      userRole: 'SystemAdmin',
      organizationId: 'ORG-001',
      sessionId: 'SESSION-abc123'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockResolvedValue({
        licenseMetricsForCandidates: {
          'SYS-001': { annualLicenseCost: 150000, maintenanceCost: 30000, userCount: 50 },
          'SYS-002': { annualLicenseCost: 45000, maintenanceCost: 10000, userCount: 50 },
          'SYS-003': { annualLicenseCost: 120000, maintenanceCost: 25000, userCount: 50 }
        },
        threeYearTCOBaseline: {
          'SYS-001': {
            candidateId: 'SYS-001',
            candidateName: 'Salesforce Alternative A',
            annualLicenseCost: 150000,
            maintenanceCost: 30000,
            threeYearTCO: 540000,
            costBreakdown: { year1: 180000, year2: 180000, year3: 180000 }
          },
          'SYS-002': {
            candidateId: 'SYS-002',
            candidateName: 'Open Source CRM B',
            annualLicenseCost: 45000,
            maintenanceCost: 10000,
            threeYearTCO: 165000,
            costBreakdown: { year1: 55000, year2: 55000, year3: 55000 }
          },
          'SYS-003': {
            candidateId: 'SYS-003',
            candidateName: 'Cloud ERP C',
            annualLicenseCost: 120000,
            maintenanceCost: 25000,
            threeYearTCO: 435000,
            costBreakdown: { year1: 145000, year2: 145000, year3: 145000 }
          }
        },
        tcoAnomalousValues: []
      })
    };

    const result = await runTx9Imp1Agent(
      {
        migrationCandidates,
        currentDateTime,
        executionContext
      },
      mockAiClient
    );

    expect(result.dataCollectionSummary).toBeDefined();
    expect(result.dataCollectionSummary.totalCandidatesProcessed).toBe(3);
    expect(result.dataCollectionSummary.successfulCollections).toBe(3);
    expect(result.dataCollectionSummary.failedCollections).toBe(0);
    expect(typeof result.dataCollectionSummary.collectionDuration).toBe('number');
    expect(result.dataCollectionSummary.collectionDuration).toBeGreaterThanOrEqual(0);
    expect(result.dataCollectionSummary.collectionDuration).toBeLessThanOrEqual(5000);

    expect(result.status).toBe('success');
    expect(result.tcoEstimationResults).toHaveLength(3);
    expect(result.tcoEstimationResults[0]).toEqual({
      candidateId: 'SYS-001',
      candidateName: 'Salesforce Alternative A',
      annualLicenseCost: 150000,
      maintenanceCost: 30000,
      threeYearTCO: 540000,
      costBreakdown: { year1: 180000, year2: 180000, year3: 180000 }
    });
    expect(result.tcoEstimationResults[1]).toEqual({
      candidateId: 'SYS-002',
      candidateName: 'Open Source CRM B',
      annualLicenseCost: 45000,
      maintenanceCost: 10000,
      threeYearTCO: 165000,
      costBreakdown: { year1: 55000, year2: 55000, year3: 55000 }
    });
    expect(result.tcoEstimationResults[2]).toEqual({
      candidateId: 'SYS-003',
      candidateName: 'Cloud ERP C',
      annualLicenseCost: 120000,
      maintenanceCost: 25000,
      threeYearTCO: 435000,
      costBreakdown: { year1: 145000, year2: 145000, year3: 145000 }
    });

    expect(result.anomalousValues).toEqual([]);
    expect(result.errorDetails).toBeNull();
  });
});
