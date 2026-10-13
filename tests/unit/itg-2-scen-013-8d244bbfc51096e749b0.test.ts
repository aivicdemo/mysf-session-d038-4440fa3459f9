import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditTrailModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-013: 異常値が複数検出された場合、全ての異常が重大度別に整理されたレスポンスで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異常値が複数検出され、重大度別に整理されたレスポンスが返される', async () => {
    // Preconditions setup
    const projectId = 'proj-2025-001';
    const targetSystemCandidates = [
      {
        systemId: 'oracle-erp-001',
        systemName: 'Oracle ERP Cloud',
        systemDescription: '移行対象のOracle請求システム',
      },
    ];
    const dataExtractionScope = {
      requiredDataItems: [
        'invoice_number',
        'invoice_date',
        'customer_id',
        'total_amount',
        'tax_amount',
        'line_item_count',
        'payment_terms',
      ],
      departmentSources: [
        {
          departmentName: 'Finance',
          sourceSystemIds: ['oracle-erp-001'],
        },
      ],
      collectionDeadline: '2025-12-31T23:59:59Z',
    };
    const tcoPeriodYears = 3;
    const anomalyDetectionThresholds = {
      costVariancePercentage: 15,
      dataCompletenessMinimum: 95,
      outlierStandardDeviations: 2.5,
    };
    const currentDateTime = '2025-01-15T10:30:00Z';
    const executingUserId = 'user-pm-001';

    // Mock verifyUserAuthenticationAndAuthorization
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-pm-001',
      roles: ['ProjectManager', 'MigrationLead'],
      hasPermission: true,
      permissionScope: 'migration_mapping_execution',
    });

    // Mock resolveProjectContext
    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-2025-001',
      projectName: 'Salesforce to Oracle Migration',
      isResolved: true,
      userHasAccess: true,
      targetSystemIds: ['oracle-erp-001'],
    });

    // Mock retrieveMappingDetailsForProject
    (mappingPersistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      projectId: 'proj-2025-001',
      projectStatus: 'active',
      projectStartDate: '2025-01-01',
      projectEndDate: '2025-12-31',
      tcoBaselineYear: 2025,
      migrationScope: 'invoice_and_line_item_objects',
    });

    // Mock recordMappingGenerationAuditTrail
    (auditTrailModule.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-trail-2025-001',
      recorded: true,
      timestamp: '2025-01-15T10:30:00Z',
      userId: 'user-pm-001',
      action: 'runTx9Imp1Agent',
    });

    // Create a fake AI client
    const fakeAiClient: Tx9Imp1AiClient = {
      extractDataItems: jest.fn(async () => ({
        totalItemsRequired: 7,
        totalItemsCollected: 6,
        completenessPercentage: 85.71,
        missingItems: ['payment_terms'],
        collectionTimestamp: '2025-01-15T10:25:00Z',
      })),
      calculateTco: jest.fn(async () => [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP Cloud',
          yearlyBreakdown: [
            {
              year: 1,
              capitalCost: 500000,
              operatingCost: 150000,
              maintenanceCost: 50000,
              totalCost: 700000,
            },
            {
              year: 2,
              capitalCost: 0,
              operatingCost: 160000,
              maintenanceCost: 55000,
              totalCost: 215000,
            },
            {
              year: 3,
              capitalCost: 0,
              operatingCost: 175000,
              maintenanceCost: 60000,
              totalCost: 235000,
            },
          ],
          threeyearTotalCost: 1150000,
          costPerUser: 2875,
          costPerTransaction: 1.15,
          calculationTimestamp: '2025-01-15T10:28:00Z',
        },
      ]),
    };

    // Call the target function
    const result = await runTx9Imp1Agent(
      {
        projectId,
        targetSystemCandidates,
        dataExtractionScope,
        tcoPeriodYears,
        anomalyDetectionThresholds,
        currentDateTime,
        executingUserId,
      },
      fakeAiClient
    );

    // Verify the status is partial_success
    expect(result.status).toBe('partial_success');

    // Verify anomalyDetectionResults contains 4 anomalies
    expect(result.anomalyDetectionResults).toHaveLength(1);
    expect(result.anomalyDetectionResults[0].anomalies).toHaveLength(4);

    // Extract anomalies for easier testing
    const anomalies = result.anomalyDetectionResults[0].anomalies;

    // Sort anomalies by severity to verify the ordering: critical -> high -> high -> medium
    const severityOrder = ['critical', 'high', 'high', 'medium'];
    anomalies.forEach((anomaly, index) => {
      expect(anomaly.severity).toBe(severityOrder[index]);
    });

    // Anomaly 1: data_completeness_below_minimum (critical)
    const anomaly1 = anomalies.find(
      (a) => a.anomalyType === 'data_completeness_below_minimum'
    );
    expect(anomaly1).toBeDefined();
    expect(anomaly1?.affectedField).toBe('completenessPercentage');
    expect(anomaly1?.detectedValue).toBe(85.71);
    expect(anomaly1?.expectedRange).toEqual({ min: 95, max: 100 });
    expect(anomaly1?.severity).toBe('critical');
    expect(anomaly1?.recommendation).toContain('欠落している payment_terms を確認');

    // Anomaly 2: cost_variance_exceeded (high) for Year 2 operatingCost
    const anomaly2 = anomalies.find(
      (a) => a.anomalyType === 'cost_variance_exceeded' && a.affectedField === 'operatingCost_year2'
    );
    expect(anomaly2).toBeDefined();
    expect(anomaly2?.detectedValue).toBe(160000);
    expect(anomaly2?.expectedRange).toEqual({ min: 127500, max: 172500 });
    expect(anomaly2?.severity).toBe('high');
    expect(anomaly2?.recommendation).toContain('Year2 のオペレーティングコストが予想範囲を');

    // Anomaly 3: cost_variance_exceeded (high) for Year 3 maintenanceCost
    const anomaly3 = anomalies.find(
      (a) => a.anomalyType === 'cost_variance_exceeded' && a.affectedField === 'maintenanceCost_year3'
    );
    expect(anomaly3).toBeDefined();
    expect(anomaly3?.detectedValue).toBe(60000);
    expect(anomaly3?.expectedRange).toEqual({ min: 42500, max: 62500 });
    expect(anomaly3?.severity).toBe('high');
    expect(anomaly3?.recommendation).toContain('Year3 のメンテナンスコストが予想範囲を');

    // Anomaly 4: outlier_detected (medium) for costPerTransaction
    const anomaly4 = anomalies.find(
      (a) => a.anomalyType === 'outlier_detected' && a.affectedField === 'costPerTransaction'
    );
    expect(anomaly4).toBeDefined();
    expect(anomaly4?.detectedValue).toBe(1.15);
    expect(anomaly4?.severity).toBe('medium');
    expect(anomaly4?.recommendation).toContain('トランザクション当たりコストが統計的外れ値');

    // Verify executionSummary
    expect(result.executionSummary.stepsCompleted).toEqual([
      'data_extraction',
      'data_collection',
      'tco_calculation',
      'anomaly_detection',
      'audit_trail_recording',
    ]);
    expect(result.executionSummary.warningsCount).toBe(4);
    expect(result.executionSummary.errorsCount).toBe(0);
    expect(result.executionSummary.auditTrailId).toBe('audit-trail-2025-001');
  });
});
