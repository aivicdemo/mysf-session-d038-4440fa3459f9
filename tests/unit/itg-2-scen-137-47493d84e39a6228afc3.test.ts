import { mapCalculationLogicsToTargetSystem } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';
import type { MapCalculationLogicsToTargetSystemInput, MapCalculationLogicsToTargetSystemOutput } from '../../src/logic/calculation-logic-mapper';

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/reference-relationship-analyzer', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reference-relationship-analyzer')>('../../src/logic/reference-relationship-analyzer'),
  analyzeReferenceRelationships: jest.fn(),
}));

describe('SCEN-137: 境界値：計算ロジックが参照関係分析で循環依存なしと判定される場合、マッピング処理が継続する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should continue mapping processing when no circular dependencies are detected', async () => {
    // Setup
    const projectId = 'proj-sales-migration-2024';
    const targetSystemId = 'target-oracle-erp-001';
    const userId = 'user-migration-manager-001';
    const executionTimestamp = new Date('2024-11-15T10:30:00Z');

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      projectStatus: 'Active',
      migrationPhase: 'LogicMappingAnalysis',
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthorized: true,
      permissions: ['mapCalculationLogics', 'assessMigrationRisk', 'viewReferences'],
    });

    // Mock analyzeReferenceRelationships
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      analysisTimestamp: '2024-11-15T10:29:00Z',
      hasCyclicDependency: false,
      dependencyGraph: {
        nodes: [
          { objectId: 'Invoice__c', objectName: 'Invoice__c' },
          { objectId: 'InvoiceLineItem__c', objectName: 'InvoiceLineItem__c' },
          { objectId: 'Opportunity__c', objectName: 'Opportunity__c' },
        ],
        edges: [
          { sourceId: 'InvoiceLineItem__c', targetId: 'Invoice__c', relationshipType: 'MasterDetail' },
          { sourceId: 'InvoiceLineItem__c', targetId: 'Opportunity__c', relationshipType: 'Lookup' },
        ],
      },
      cyclicPaths: [],
    });

    const calculationLogics = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Invoice Total Amount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SUM(InvoiceLineItem__c.Amount__c WHERE Invoice__c.Id = this.Id)',
        salesforceLogic: 'ROLLUP(InvoiceLineItem__c, SUM, Amount__c)',
        referenceFieldList: ['InvoiceLineItem__c'],
        dependentLogicIds: [],
      },
      {
        calculationLogicId: 'calc-002',
        logicName: 'Unit Price with Discount',
        logicType: 'WorkflowRule',
        targetObjectId: 'InvoiceLineItem__c',
        targetFieldName: 'UnitPrice__c',
        existingSystemLogic: 'IF Opportunity.Amount > 100000 THEN UnitPrice = BasePrice * 0.9',
        salesforceLogic: 'Opportunity__r.Amount__c > 100000',
        referenceFieldList: ['Opportunity__c'],
        dependentLogicIds: [],
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'DatabaseTrigger',
        functionCategory: 'automation',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'StoredProcedure',
        functionCategory: 'database',
        complexityLevel: 3,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: MapCalculationLogicsToTargetSystemInput = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    // Execute
    const result: MapCalculationLogicsToTargetSystemOutput = await mapCalculationLogicsToTargetSystem(input);

    // Verify
    expect(result.mappingResults).toHaveLength(2);
    expect(result.incompatibleLogicsCount).toBe(0);
    expect(result.overallMigrationComplexity).toMatch(/^(Low|Medium)$/);
    expect(['Low', 'Medium', 'High', 'Critical']).toContain(result.overallMigrationRisk);
    expect(result.totalEstimatedEffort).toBeGreaterThan(0);
    expect(result.recommendedMitigationStrategies).toBeInstanceOf(Array);
    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
