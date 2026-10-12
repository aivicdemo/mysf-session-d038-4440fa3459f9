import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-082: 複数のシステム候補について一部のデータ収集に失敗した場合、statusをpartial_successとし、成功したデータのみTCO試算結果を返す', () => {
  it('should return partial_success status when some candidates fail data collection', async () => {
    const migrationCandidates = [
      {
        candidateId: 'CAND-001',
        candidateName: 'Microsoft Dynamics 365',
        systemType: 'CRM',
        description: 'Cloud-based CRM alternative'
      },
      {
        candidateId: 'CAND-002',
        candidateName: 'Oracle NetSuite',
        systemType: 'ERP',
        description: 'Integrated ERP solution'
      },
      {
        candidateId: 'CAND-003',
        candidateName: 'SAP C/4HANA',
        systemType: 'CRM',
        description: 'SAP cloud solution'
      }
    ];
    const currentDateTime = new Date('2026-10-07T10:00:00.000Z');
    const executionContext = {
      userId: 'user-12345',
      userRole: 'finance_manager',
      organizationId: 'org-67890',
      sessionId: 'session-abc123'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockResolvedValue({
        licenseMetricsForCandidates: {
          'CAND-001': { annualLicenseCost: 45000, maintenanceCost: 9000, userCount: 50 },
          'CAND-002': null,
          'CAND-003': { annualLicenseCost: 72000, maintenanceCost: 14400, userCount: 75 }
        },
        threeYearTCOBaseline: {
          'CAND-001': { year1: 54000, year2: 54000, year3: 54000, threeYearTotal: 162000 },
          'CAND-002': null,
          'CAND-003': { year1: 86400, year2: 86400, year3: 86400, threeYearTotal: 259200 }
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

    expect(result.status).toBe('partial_success');

    expect(result.tcoEstimationResults).toBeDefined();
    const resultCandidateIds = result.tcoEstimationResults.map(r => r.candidateId);
    expect(resultCandidateIds).toContain('CAND-001');
    expect(resultCandidateIds).toContain('CAND-003');
    expect(resultCandidateIds).not.toContain('CAND-002');

    expect(result.tcoEstimationResults.find(r => r.candidateId === 'CAND-001')).toEqual({
      candidateId: 'CAND-001',
      candidateName: 'Microsoft Dynamics 365',
      annualLicenseCost: 45000,
      maintenanceCost: 9000,
      threeYearTCO: 162000,
      costBreakdown: { year1: 54000, year2: 54000, year3: 54000 }
    });

    expect(result.tcoEstimationResults.find(r => r.candidateId === 'CAND-003')).toEqual({
      candidateId: 'CAND-003',
      candidateName: 'SAP C/4HANA',
      annualLicenseCost: 72000,
      maintenanceCost: 14400,
      threeYearTCO: 259200,
      costBreakdown: { year1: 86400, year2: 86400, year3: 86400 }
    });

    expect(result.anomalousValues).toEqual([]);

    expect(result.dataCollectionSummary.totalCandidatesProcessed).toBe(3);
    expect(result.dataCollectionSummary.successfulCollections).toBe(2);
    expect(result.dataCollectionSummary.failedCollections).toBe(1);
    expect(typeof result.dataCollectionSummary.collectionDuration).toBe('number');

    expect(result.executionLog).toBeDefined();
    expect(result.executionLog.length).toBeGreaterThan(0);
    result.executionLog.forEach((log) => {
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(typeof log.step).toBe('string');
      expect(['running', 'success', 'failed']).toContain(log.status);
    });

    expect(result.errorDetails).toBeDefined();
    if (result.errorDetails !== null && result.errorDetails !== undefined) {
      expect(Array.isArray(result.errorDetails)).toBe(true);
      const cand002Error = result.errorDetails.find(err => err.affectedCandidates?.includes('CAND-002'));
      expect(cand002Error).toBeDefined();
      if (cand002Error) {
        expect(typeof cand002Error.errorCode).toBe('string');
        expect(typeof cand002Error.errorMessage).toBe('string');
        expect(Array.isArray(cand002Error.affectedCandidates)).toBe(true);
        expect(cand002Error.affectedCandidates).toContain('CAND-002');
      }
    }
  });

  it('should include collection failure details in executionLog', async () => {
    const migrationCandidates = [
      { candidateId: 'CAND-001', candidateName: 'Microsoft Dynamics 365', systemType: 'CRM' },
      { candidateId: 'CAND-002', candidateName: 'Oracle NetSuite', systemType: 'ERP' },
      { candidateId: 'CAND-003', candidateName: 'SAP C/4HANA', systemType: 'CRM' }
    ];
    const currentDateTime = new Date('2026-10-07T10:00:00.000Z');
    const executionContext = {
      userId: 'user-12345',
      userRole: 'finance_manager',
      organizationId: 'org-67890',
      sessionId: 'session-abc123'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockResolvedValue({
        licenseMetricsForCandidates: {
          'CAND-001': { annualLicenseCost: 45000, maintenanceCost: 9000, userCount: 50 },
          'CAND-002': null,
          'CAND-003': { annualLicenseCost: 72000, maintenanceCost: 14400, userCount: 75 }
        },
        threeYearTCOBaseline: {
          'CAND-001': { year1: 54000, year2: 54000, year3: 54000, threeYearTotal: 162000 },
          'CAND-002': null,
          'CAND-003': { year1: 86400, year2: 86400, year3: 86400, threeYearTotal: 259200 }
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

    const executionLogStatuses = result.executionLog.map(log => log.status);
    expect(executionLogStatuses).toContain('success');
    expect(executionLogStatuses.filter(s => s === 'success').length).toBeGreaterThan(0);
  });
});
