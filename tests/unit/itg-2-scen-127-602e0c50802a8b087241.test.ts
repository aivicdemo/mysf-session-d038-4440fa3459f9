import { mapCalculationLogicsToTargetSystem } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-127: 複数の計算ロジックが移行対象システムの実装方式に正常にマッピング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should map calculation logics to target system and return correct results', async () => {
    const projectId = 'PROJ-001';
    const targetSystemId = 'TGTSY-oracle-001';
    const userId = 'user-001';
    const executionTimestamp = new Date('2026-01-15T09:30:00Z');

    const calculationLogics = [
      {
        calculationLogicId: 'calc-logic-001',
        logicName: 'InvoiceTotalAmount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SELECT SUM(amount) FROM invoice_line_items WHERE invoice_id = inv.id',
        salesforceLogic: 'InvoiceLineItem__r.Amount__c.sum()',
        logicDescription: '請求書の合計金額を計算（請求明細の合計）',
      },
      {
        calculationLogicId: 'calc-logic-002',
        logicName: 'InvoiceStatus',
        logicType: 'AutomationRule',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Status__c',
        existingSystemLogic: "UPDATE invoices SET status = CASE WHEN total_amount > 10000 THEN 'HighValue' ELSE 'Standard' END",
        salesforceLogic: "IF(TotalAmount__c > 10000, SetFieldValue(Status__c, 'HighValue'), SetFieldValue(Status__c, 'Standard'))",
        logicDescription: '請求書金額により請求書ステータスを自動設定',
      },
      {
        calculationLogicId: 'calc-logic-003',
        logicName: 'LineItemUnitPrice',
        logicType: 'AutomationRule',
        targetObjectId: 'InvoiceLineItem__c',
        targetFieldName: 'UnitPrice__c',
        existingSystemLogic: "SELECT unit_price FROM opportunities WHERE stage_name = 'Closed Won' AND amount > 50000",
        salesforceLogic: "OpportunityStageName = 'Closed Won' AND OpportunityAmount > 50000",
        logicDescription: '商談情報から請求明細の単価を取得',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'DatabaseComputedColumn',
        functionCategory: 'FieldCalculation',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'DatabaseTrigger',
        functionCategory: 'AutomationRule',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-003',
        functionName: 'StoredProcedure',
        functionCategory: 'AutomationRule',
        complexityLevel: 3,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      userRole: 'mapper',
      isContextValid: true,
    });

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'mapping-calculation-logics',
    });

    (referenceAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      referenceGraph: { nodes: [], edges: [] },
      circularDependencies: [],
      targetSystemCompatibility: {
        overallCompatibility: 'compatible',
        compatibleReferences: [],
        incompatibleReferences: [],
        recommendations: [],
      },
      analysisMetadata: {
        executedAt: executionTimestamp,
        executedByUserId: userId,
        processingTimeMs: 100,
        analysisVersion: '1.0',
      },
    });

    const result = await mapCalculationLogicsToTargetSystem({
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    });

    expect(result.mappingResults).toHaveLength(3);

    expect(result.mappingResults[0]).toEqual(
      expect.objectContaining({
        calculationLogicId: 'calc-logic-001',
        logicName: 'InvoiceTotalAmount',
        mappedCapabilityId: 'cap-001',
        migrationComplexity: 'Low',
        migrationRisk: 'Low',
        estimatedEffort: 0.5,
      })
    );

    expect(result.mappingResults[1]).toEqual(
      expect.objectContaining({
        calculationLogicId: 'calc-logic-002',
        logicName: 'InvoiceStatus',
        mappedCapabilityId: 'cap-002',
        migrationComplexity: 'Medium',
        migrationRisk: 'Medium',
        estimatedEffort: 2.0,
      })
    );

    expect(result.mappingResults[2]).toEqual(
      expect.objectContaining({
        calculationLogicId: 'calc-logic-003',
        logicName: 'LineItemUnitPrice',
        mappedCapabilityId: 'cap-003',
        migrationComplexity: 'Medium',
        migrationRisk: 'High',
        estimatedEffort: 3.5,
      })
    );

    expect(result.overallMigrationComplexity).toBe('Medium');
    expect(result.overallMigrationRisk).toBe('Medium');
    expect(result.totalEstimatedEffort).toBe(6.0);
    expect(result.incompatibleLogicsCount).toBe(0);
    expect(result.recommendedMitigationStrategies.length).toBeGreaterThanOrEqual(2);
    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
