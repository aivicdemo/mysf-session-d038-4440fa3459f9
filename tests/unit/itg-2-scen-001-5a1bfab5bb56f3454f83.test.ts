import { runTx9Imp1Agent, type Tx9Imp1AiClient, type Tx9Imp1AgentInput, type Tx9Imp1AgentOutput } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

const mockAuthModule = authModule as jest.Mocked<typeof authModule>;
const mockContextModule = contextModule as jest.Mocked<typeof contextModule>;
const mockMappingModule = mappingModule as jest.Mocked<typeof mappingModule>;
const mockAuditModule = auditModule as jest.Mocked<typeof auditModule>;

describe('SCEN-001: 認証済み・権限ありのユーザーが正常な入力で処理を実行', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('全ステップが完了し、TCO試算結果と異常値検出結果を含む成功レスポンスが返される', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractData: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
      generateSheet: jest.fn(),
    };

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-001',
      userRole: 'migration_project_manager',
      permissions: ['execute_ai_agent', 'read_system_metadata', 'manage_mappings', 'view_tco_analysis'],
      sessionValid: true,
      sessionExpiryTime: '2026-10-15T18:30:00Z',
    });

    mockContextModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-sf-migration-2026',
      projectName: 'Salesforce to Oracle/SAP Migration',
      migrationTargetSystemIds: ['oracle-erp-01', 'sap-s4-01'],
      userAccessLevel: 'full',
      isAccessGranted: true,
    });

    mockMappingModule.retrieveMappingDetailsForProject.mockResolvedValue({
      projectId: 'proj-sf-migration-2026',
      projectStatus: 'active',
      projectStartDate: '2026-01-01T00:00:00Z',
      projectEndDate: '2027-12-31T23:59:59Z',
      tcoPeriod: 3,
      projectPhase: 'analysis_and_planning',
      lastSyncTimestamp: '2026-10-15T09:00:00Z',
      mappingVersion: '1.2.3',
    });

    mockAuditModule.recordMappingGenerationAuditTrail.mockResolvedValue({
      auditTrailId: 'audit-trail-20261015-001',
      recordedTimestamp: '2026-10-15T10:30:00Z',
      userId: 'user-001',
      actionType: 'tco_analysis_execution',
      status: 'recorded',
      details: {
        projectId: 'proj-sf-migration-2026',
        targetSystems: ['oracle-erp-01', 'sap-s4-01'],
        executionTimeMs: 15420,
      },
    });

    const input: Tx9Imp1AgentInput = {
      projectId: 'proj-sf-migration-2026',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-01',
          systemName: 'Oracle E-Business Suite',
          systemDescription: '移行対象のOracle ERP。請求書・請求明細機能を標準装備。',
        },
        {
          systemId: 'sap-s4-01',
          systemName: 'SAP S/4HANA',
          systemDescription: '移行対象のSAP。請求処理の標準機能あり。',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: [
          'invoice_number',
          'invoice_date',
          'customer_id',
          'customer_name',
          'line_item_description',
          'quantity',
          'unit_price',
          'line_total',
          'tax_amount',
          'invoice_total',
          'payment_status',
          'due_date',
        ],
        departmentSources: [
          { departmentName: '財務部', sourceSystemIds: ['oracle-erp-01'] },
          { departmentName: '営業部', sourceSystemIds: ['oracle-erp-01', 'sap-s4-01'] },
        ],
        collectionDeadline: '2026-12-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 90,
        outlierStandardDeviations: 2.5,
      },
      currentDateTime: '2026-10-15T10:30:00Z',
      executingUserId: 'user-001',
    };

    const result = await runTx9Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('success');

    expect(result.extractedDataItems).toHaveLength(12);
    expect(result.extractedDataItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          itemName: expect.stringMatching(/invoice_number|invoice_date|customer_id|customer_name|line_item_description|quantity|unit_price|line_total|tax_amount|invoice_total|payment_status|due_date/),
          itemType: expect.any(String),
          sourceSystem: expect.stringMatching(/oracle-erp-01|sap-s4-01/),
          extractedValue: expect.any([String, Number, Boolean]),
          extractionTimestamp: '2026-10-15T10:30:00Z',
        })
      ])
    );

    expect(result.collectedDataSummary).toEqual(
      expect.objectContaining({
        totalItemsRequired: 12,
        totalItemsCollected: 12,
        completenessPercentage: 100.0,
        missingItems: [],
        collectionTimestamp: '2026-10-15T10:30:00Z',
      })
    );

    expect(result.tcoCalculationResult).toHaveLength(2);
    result.tcoCalculationResult.forEach((tco) => {
      expect(tco.systemId).toMatch(/oracle-erp-01|sap-s4-01/);
      expect(tco.yearlyBreakdown).toHaveLength(3);
      tco.yearlyBreakdown.forEach((breakdown, idx) => {
        expect(breakdown.year).toBe(idx + 1);
        expect(breakdown.capitalCost).toBeGreaterThanOrEqual(0);
        expect(breakdown.operatingCost).toBeGreaterThanOrEqual(0);
        expect(breakdown.maintenanceCost).toBeGreaterThanOrEqual(0);
        expect(breakdown.totalCost).toBeGreaterThanOrEqual(0);
      });
      expect(tco.threeyearTotalCost).toBeGreaterThanOrEqual(0);
      expect(tco.costPerUser).toBeGreaterThanOrEqual(0);
      expect(tco.costPerTransaction).toBeGreaterThanOrEqual(0);
      expect(tco.calculationTimestamp).toBe('2026-10-15T10:30:00Z');
    });

    expect(result.anomalyDetectionResults).toHaveLength(2);
    result.anomalyDetectionResults.forEach((anomaly) => {
      expect(anomaly.systemId).toMatch(/oracle-erp-01|sap-s4-01/);
      expect(Array.isArray(anomaly.anomalies)).toBe(true);
      expect(anomaly.detectionTimestamp).toBe('2026-10-15T10:30:00Z');
    });

    expect(result.organizedDataSheet).toBeDefined();
    expect(result.organizedDataSheet).toEqual(
      expect.objectContaining({
        sheetId: expect.any(String),
        sheetName: expect.any(String),
        rowCount: expect.any(Number),
        columnCount: expect.any(Number),
        dataUrl: expect.any(String),
        generatedTimestamp: '2026-10-15T10:30:00Z',
      })
    );

    expect(result.executionSummary).toEqual(
      expect.objectContaining({
        totalExecutionTimeMs: expect.any(Number),
        stepsCompleted: expect.arrayContaining([
          'data_extraction',
          'data_collection',
          'tco_calculation',
          'anomaly_detection',
          'sheet_generation',
          'audit_recording',
        ]),
        stepsFailed: [],
        warningsCount: 0,
        errorsCount: 0,
        auditTrailId: 'audit-trail-20261015-001',
      })
    );

    expect(mockAuthModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith('user-001');
    expect(mockContextModule.resolveProjectContext).toHaveBeenCalledWith('proj-sf-migration-2026', 'user-001');
    expect(mockMappingModule.retrieveMappingDetailsForProject).toHaveBeenCalledWith('proj-sf-migration-2026');
    expect(mockAuditModule.recordMappingGenerationAuditTrail).toHaveBeenCalled();
  });
});
