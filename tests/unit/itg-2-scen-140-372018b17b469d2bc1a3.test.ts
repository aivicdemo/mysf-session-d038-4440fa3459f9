import { mapCalculationLogicsToTargetSystem } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';
import type { MapCalculationLogicsToTargetSystemInput, CalculationLogicDefinition, MapCalculationLogicsToTargetSystemOutput } from '../../src/logic/calculation-logic-mapper';
import type { TargetSystemCapability } from '../../src/logic/risk-assessment-service';

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

describe('SCEN-140: mapCalculationLogicsToTargetSystem - 複数の対応策が検出される場合', () => {
  const projectId = 'proj-SF-migration-001';
  const targetSystemId = 'target-oracle-erp-001';
  const userId = 'user-migration-manager-001';
  const executionTimestamp = new Date('2026-10-07T10:30:00.000Z');

  const calculationLogics = [
    {
      calculationLogicId: 'calc-001',
      logicName: 'Invoice Total Calculation',
      logicType: 'FieldCalculation',
      targetObjectId: 'Invoice__c',
      targetFieldName: 'TotalAmount__c',
      existingSystemLogic: 'SUM(InvoiceLineItems.Amount)',
      salesforceLogic: 'ROLLUP(InvoiceLineItem__r, SUM, Amount__c)',
      referenceFieldList: ['InvoiceLineItem__r', 'Amount__c'],
      dependentLogicIds: [],
    },
    {
      calculationLogicId: 'calc-002',
      logicName: 'Opportunity Approval',
      logicType: 'ProcessBuilder',
      targetObjectId: 'Opportunity',
      targetFieldName: 'EstimatedRevenue',
      existingSystemLogic: 'IF Amount > 100000 THEN SendApprovalEmail ELSE Log',
      salesforceLogic: 'Process: Validate Amount -> Send Email',
      referenceFieldList: ['Amount'],
      dependentLogicIds: [],
    },
    {
      calculationLogicId: 'calc-003',
      logicName: 'Account Status Update',
      logicType: 'Workflow',
      targetObjectId: 'Account',
      targetFieldName: 'Status',
      existingSystemLogic: 'IF CreatedDate < 30days AGO THEN Status = \'Inactive\'',
      salesforceLogic: 'Scheduled Action: Update field after 30 days',
      referenceFieldList: ['CreatedDate'],
      dependentLogicIds: [],
    },
  ];

  const targetSystemCapabilities = [
    {
      capabilityId: 'cap-001',
      functionName: 'Database Trigger',
      functionCategory: 'FieldCalculation',
      complexityLevel: 2,
      isMappingTarget: true,
      dependentCapabilityIds: [],
    },
    {
      capabilityId: 'cap-002',
      functionName: 'Procedure Call',
      functionCategory: 'ProcessBuilder',
      complexityLevel: 3,
      isMappingTarget: true,
      dependentCapabilityIds: [],
    },
    {
      capabilityId: 'cap-003',
      functionName: 'Job Scheduler',
      functionCategory: 'Workflow',
      complexityLevel: 3,
      isMappingTarget: true,
      dependentCapabilityIds: [],
    },
  ];

  const projectContext = {
    projectId: 'proj-SF-migration-001',
    targetSystemId: 'target-oracle-erp-001',
    projectName: 'Salesforce to Oracle Migration',
    status: 'InProgress',
  };

  const userAuthorization = {
    userId: 'user-migration-manager-001',
    isAuthorized: true,
    permissions: ['FeatureMapping', 'RiskAssessment', 'MigrationPlanning'],
  };

  const referenceGraph = {
    referenceGraph: {
      Invoice__c: ['Account', 'Opportunity'],
      InvoiceLineItem__r: ['Invoice__c', 'Product2'],
      Opportunity: ['Account'],
    },
    hasCircularDependency: false,
    dependencyComplexity: 'Medium',
  };

  beforeEach(() => {
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(projectContext);
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      userAuthorization
    );
    (referenceAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue(referenceGraph);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('複数の対応策が検出される場合、recommendedMitigationStrategiesに全件が配列で返される', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    const result = await mapCalculationLogicsToTargetSystem(input);

    // 出力型フィールドが設定されていることを確認
    expect(result).toHaveProperty('mappingResults');
    expect(result).toHaveProperty('overallMigrationComplexity');
    expect(result).toHaveProperty('overallMigrationRisk');
    expect(result).toHaveProperty('totalEstimatedEffort');
    expect(result).toHaveProperty('incompatibleLogicsCount');
    expect(result).toHaveProperty('recommendedMitigationStrategies');
    expect(result).toHaveProperty('executionTimestamp');

    // mappingResults は3件のCalculationLogicMappingResultを配列で返す
    expect(Array.isArray(result.mappingResults)).toBe(true);
    expect(result.mappingResults.length).toBe(3);

    // 各マッピング結果が必須フィールドを持つ
    result.mappingResults.forEach((mapping) => {
      expect(mapping).toHaveProperty('calculationLogicId');
      expect(mapping).toHaveProperty('logicName');
      expect(mapping).toHaveProperty('mappedCapabilityId');
      expect(mapping).toHaveProperty('mappedCapabilityName');
      expect(mapping).toHaveProperty('implementationApproach');
      expect(mapping).toHaveProperty('migrationComplexity');
      expect(mapping).toHaveProperty('migrationRisk');
      expect(mapping).toHaveProperty('estimatedEffort');
      expect(mapping).toHaveProperty('riskFactors');
      expect(mapping).toHaveProperty('recommendedActions');
    });

    // recommendedMitigationStrategies は3件以上のMitigationStrategyを含む
    expect(Array.isArray(result.recommendedMitigationStrategies)).toBe(true);
    expect(result.recommendedMitigationStrategies.length).toBeGreaterThanOrEqual(3);

    // 各MitigationStrategyが必須フィールドを持つ
    result.recommendedMitigationStrategies.forEach((strategy) => {
      expect(strategy).toHaveProperty('strategyId');
      expect(strategy).toHaveProperty('targetRiskFactorId');
      expect(strategy).toHaveProperty('mitigationApproach');
      expect(strategy).toHaveProperty('mitigationActions');
      expect(strategy).toHaveProperty('expectedEffectiveness');
      expect(strategy).toHaveProperty('estimatedEffort');
    });

    // overallMigrationComplexity は 'High'
    expect(result.overallMigrationComplexity).toBe('High');

    // overallMigrationRisk は 'High'
    expect(result.overallMigrationRisk).toBe('High');

    // totalEstimatedEffort は 7.5 以上
    expect(result.totalEstimatedEffort).toBeGreaterThanOrEqual(7.5);

    // incompatibleLogicsCount は 0
    expect(result.incompatibleLogicsCount).toBe(0);

    // 3つのリスク要因に対応する対応策が検出されていることを確認
    const strategyCount = result.recommendedMitigationStrategies.length;
    expect(strategyCount).toBeGreaterThanOrEqual(3);
  });

  test('各計算ロジックのリスク要因に対して個別のMitigationStrategyが検出される', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    const result = await mapCalculationLogicsToTargetSystem(input);

    // calc-001はComplexDataAggregationリスク要因
    const mapping001 = result.mappingResults.find((m) => m.calculationLogicId === 'calc-001');
    expect(mapping001).toBeDefined();
    expect(mapping001!.riskFactors).toContain('ComplexDataAggregation');

    // calc-002はExternalSystemIntegrationリスク要因
    const mapping002 = result.mappingResults.find((m) => m.calculationLogicId === 'calc-002');
    expect(mapping002).toBeDefined();
    expect(mapping002!.riskFactors).toContain('ExternalSystemIntegration');

    // calc-003はScheduledTimeBasedExecutionリスク要因
    const mapping003 = result.mappingResults.find((m) => m.calculationLogicId === 'calc-003');
    expect(mapping003).toBeDefined();
    expect(mapping003!.riskFactors).toContain('ScheduledTimeBasedExecution');

    // 複数の対応策が配列として集約されている
    expect(result.recommendedMitigationStrategies.length).toBeGreaterThanOrEqual(3);
  });
});
