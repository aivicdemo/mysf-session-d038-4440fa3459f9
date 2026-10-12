import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('SCEN-080: 処理完了時に、実行ログに各ステップのタイムスタンプ・ステップ名・ステータス・詳細情報を記録して返す', () => {
  it('should return execution log with timestamps, step names, status, and details', async () => {
    const migrationCandidates = [
      {
        candidateId: 'SYS-001',
        candidateName: 'Oracle NetSuite',
        systemType: 'ERP',
        description: 'クラウドERP候補'
      },
      {
        candidateId: 'SYS-002',
        candidateName: 'SAP S/4HANA Cloud',
        systemType: 'ERP',
        description: 'クラウドERP候補'
      }
    ];
    const currentDateTime = new Date('2025-01-15T10:30:00Z');
    const executionContext = {
      userId: 'user-12345',
      userRole: 'admin',
      organizationId: 'org-001',
      sessionId: 'sess-67890'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockResolvedValue({
        licenseMetricsForCandidates: [
          {
            candidateId: 'SYS-001',
            candidateName: 'Oracle NetSuite',
            licenseType: 'Cloud',
            userCount: 50,
            annualLicenseCost: 150000
          },
          {
            candidateId: 'SYS-002',
            candidateName: 'SAP S/4HANA Cloud',
            licenseType: 'Cloud',
            userCount: 50,
            annualLicenseCost: 180000
          }
        ],
        threeYearTCOBaseline: [
          {
            candidateId: 'SYS-001',
            candidateName: 'Oracle NetSuite',
            annualLicenseCost: 150000,
            maintenanceCost: 30000,
            threeYearTCO: 540000,
            costBreakdown: { year1: 180000, year2: 180000, year3: 180000 }
          },
          {
            candidateId: 'SYS-002',
            candidateName: 'SAP S/4HANA Cloud',
            annualLicenseCost: 180000,
            maintenanceCost: 36000,
            threeYearTCO: 648000,
            costBreakdown: { year1: 216000, year2: 216000, year3: 216000 }
          }
        ],
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

    expect(result.executionLog).toBeDefined();
    expect(Array.isArray(result.executionLog)).toBe(true);
    expect(result.executionLog.length).toBeGreaterThan(0);

    const prevTimestamp = result.executionLog.map(log => log.timestamp);
    for (let i = 1; i < prevTimestamp.length; i++) {
      expect(prevTimestamp[i].getTime()).toBeGreaterThanOrEqual(prevTimestamp[i - 1].getTime());
    }

    result.executionLog.forEach((log) => {
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(typeof log.step).toBe('string');
      expect(log.step.length).toBeGreaterThan(0);
      expect(['running', 'success', 'failed']).toContain(log.status);
      if (log.details) {
        expect(typeof log.details).toBe('string');
      }
    });

    const stepNames = result.executionLog.map(log => log.step);
    const expectedSteps = ['候補リスト検証', 'データ収集開始', 'データ収集完了', 'TCO試算計算', '異常値検出', '処理完了'];
    expectedSteps.forEach(step => {
      expect(stepNames.some(s => s.includes(step) || s.match(new RegExp(step)))).toBe(true);
    });

    expect(result.status).toBe('success');
    expect(result.tcoEstimationResults).toHaveLength(2);
    expect(result.anomalousValues).toEqual([]);
    expect(result.dataCollectionSummary.totalCandidatesProcessed).toBe(2);
    expect(result.dataCollectionSummary.successfulCollections).toBe(2);
    expect(result.dataCollectionSummary.failedCollections).toBe(0);
    expect(result.errorDetails).toBeNull();
  });

  it('should record log details with step descriptions', async () => {
    const migrationCandidates = [
      { candidateId: 'SYS-001', candidateName: 'Oracle NetSuite', systemType: 'ERP' }
    ];
    const currentDateTime = new Date('2025-01-15T10:30:00Z');
    const executionContext = {
      userId: 'user-12345',
      userRole: 'admin',
      organizationId: 'org-001',
      sessionId: 'sess-67890'
    };

    const mockAiClient: Tx9Imp1AiClient = {
      estimateTCOForMigrationCandidates: jest.fn().mockResolvedValue({
        licenseMetricsForCandidates: [
          {
            candidateId: 'SYS-001',
            candidateName: 'Oracle NetSuite',
            annualLicenseCost: 150000,
            maintenanceCost: 30000
          }
        ],
        threeYearTCOBaseline: [
          {
            candidateId: 'SYS-001',
            candidateName: 'Oracle NetSuite',
            annualLicenseCost: 150000,
            maintenanceCost: 30000,
            threeYearTCO: 540000,
            costBreakdown: { year1: 180000, year2: 180000, year3: 180000 }
          }
        ],
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

    const successLogs = result.executionLog.filter(log => log.status === 'success');
    expect(successLogs.length).toBeGreaterThan(0);

    successLogs.forEach((log) => {
      expect(log.details).toBeDefined();
      if (log.details) {
        expect(log.details.length).toBeGreaterThan(0);
      }
    });
  });
});
