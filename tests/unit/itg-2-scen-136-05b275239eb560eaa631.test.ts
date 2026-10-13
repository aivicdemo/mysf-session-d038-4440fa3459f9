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

describe('SCEN-136: 境界値：すべての計算ロジックが移行対象システムで実装不可能な場合、overallMigrationComplexityが「Critical」、incompatibleLogicsCountが計算ロジック数と一致する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return Critical complexity and all logics as incompatible', async () => {
    // Setup
    const projectId = 'PROJ-001';
    const targetSystemId = 'TGTSYS-Oracle';
    const userId = 'USER-mapper-001';
    const executionTimestamp = new Date();

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      resolvedSuccessfully: true,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      hasFeatureMappingPermission: true,
      authorized: true,
    });

    // Mock analyzeReferenceRelationships
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      dependencyGraph: [
        {
          fromLogicId: 'CALC-001',
          toLogicIds: ['CALC-002', 'CALC-003'],
          dependencyType: 'FunctionalDependency',
          isCircular: false,
        },
        {
          fromLogicId: 'CALC-002',
          toLogicIds: ['CALC-001'],
          dependencyType: 'DataFlowDependency',
          isCircular: false,
        },
        {
          fromLogicId: 'CALC-004',
          toLogicIds: [],
          dependencyType: 'ExternalServiceDependency',
          isCircular: false,
        },
        {
          fromLogicId: 'CALC-005',
          toLogicIds: [],
          dependencyType: 'ConfigurationDependency',
          isCircular: false,
        },
      ],
      hasCircularDependency: false,
      externalServiceDependencies: ['MLService', 'SAPTaxModule'],
    });

    const calculationLogics = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'Complex Invoice Total',
        logicType: 'ProcessBuilder',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Total_Amount__c',
        logicDescription: '複雑な条件付き集計ロジック（ネストされた条件分岐5段階、カスタム関数使用）',
        existingSystemLogic: 'SQL stored procedure with cursor loop',
        salesforceLogic: 'Advanced formula with nested IF, complex SOQL subquery aggregation',
      },
      {
        calculationLogicId: 'CALC-002',
        logicName: 'Dynamic Discount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice_Line_Item__c',
        targetFieldName: 'Discount_Amount__c',
        logicDescription: '動的割引率計算（参照オブジェクト経由の多段リンク参照）',
        existingSystemLogic: 'Custom C code with external API call',
        salesforceLogic: 'Formula referencing related Account fields via 4-level relationship traversal',
      },
      {
        calculationLogicId: 'CALC-003',
        logicName: 'Time-based Approval',
        logicType: 'Workflow',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Approval_Status__c',
        logicDescription: '時間ベースの自動承認フロー（複数条件＋タイマー処理）',
        existingSystemLogic: 'Scheduled batch job in COBOL',
        salesforceLogic: 'Time-dependent workflow with multiple field updates and email alerts',
      },
      {
        calculationLogicId: 'CALC-004',
        logicName: 'ML-based Opportunity Revenue',
        logicType: 'ProcessBuilder',
        targetObjectId: 'Opportunity',
        targetFieldName: 'Expected_Revenue__c',
        logicDescription: '確度評価ロジック（外部システム連携含む）',
        existingSystemLogic: 'REST API integration with Python microservice',
        salesforceLogic: 'Process Builder with HTTP callout to external ML service',
      },
      {
        calculationLogicId: 'CALC-005',
        logicName: 'Multi-tier Tax Calculation',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Tax_Amount__c',
        logicDescription: '税計算ロジック（地域別税率、複数税種組合せ）',
        existingSystemLogic: 'SAP tax module integration',
        salesforceLogic: 'Custom formula with lookup to tax rate configuration table',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'CAP-Oracle-SQL',
        functionName: 'SQL Stored Procedure',
        functionCategory: 'database',
        complexityLevel: 3,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'CAP-Oracle-Trigger',
        functionName: 'Database Trigger',
        functionCategory: 'database',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'CAP-Oracle-View',
        functionName: 'Materialized View',
        functionCategory: 'database',
        complexityLevel: 2,
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
    expect(result.mappingResults).toHaveLength(5);
    expect(result.overallMigrationComplexity).toBe('Critical');
    expect(result.incompatibleLogicsCount).toBe(5);
    expect(result.overallMigrationRisk).toBe('Critical');

    // Verify each calculation logic is marked as incompatible
    result.mappingResults.forEach((mapping) => {
      expect(mapping.migrationComplexity).toBe('Critical');
      expect(['INCOMPATIBLE', 'Incompatible']).toContain(mapping.implementationApproach);
    });

    // Verify mitigation strategies are provided
    expect(result.recommendedMitigationStrategies.length).toBeGreaterThan(0);

    // Verify execution timestamp is set
    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
