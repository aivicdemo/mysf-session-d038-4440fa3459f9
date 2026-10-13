import { mapCalculationLogicsToTargetSystem } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';
import type { MapCalculationLogicsToTargetSystemInput } from '../../src/logic/calculation-logic-mapper';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-139: 移行難易度が複数のロジック組み合わせで段階的に評価される場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('最も高い難易度が全体難易度として返される', async () => {
    // Arrange: preconditions のデータを用意
    const projectId = 'proj-001';
    const targetSystemId = 'sys-oracle-001';
    const userId = 'user-123';
    const executionTimestamp = new Date('2026-10-08T10:00:00Z');

    const calculationLogics = [
      {
        calculationLogicId: 'logic-001',
        logicName: 'Invoice Total Amount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SELECT SUM(LineAmount) FROM InvoiceLine WHERE InvoiceId = :invoiceId',
        salesforceLogic: 'SUM(InvoiceLines__r.LineAmount__c)',
      },
      {
        calculationLogicId: 'logic-002',
        logicName: 'Invoice Line Net Amount',
        logicType: 'Workflow',
        targetObjectId: 'InvoiceLine__c',
        targetFieldName: 'NetAmount__c',
        existingSystemLogic: 'NetAmount = (UnitPrice * Quantity) * (1 - DiscountRate)',
        salesforceLogic: 'IF(AND(UnitPrice__c > 0, Quantity__c > 0), (UnitPrice__c * Quantity__c) * (1 - DiscountRate__c), 0)',
      },
      {
        calculationLogicId: 'logic-003',
        logicName: 'Invoice Approval Status',
        logicType: 'ProcessBuilder',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'ApprovalStatus__c',
        existingSystemLogic: "IF(TotalAmount >= 100000) THEN Status = 'PendingApproval' ELSE Status = 'AutoApproved'",
        salesforceLogic: "IF(TotalAmount__c >= 100000, 'PendingApproval', 'AutoApproved')",
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'FIELD_CALCULATION',
        functionCategory: 'Calculation',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'WORKFLOW',
        functionCategory: 'Workflow',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-003',
        functionName: 'PROCESS_BUILDER',
        functionCategory: 'Workflow',
        complexityLevel: 3,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const projectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      projectStatus: 'active',
    };

    const userAuthorization = {
      userId: 'user-123',
      isAuthorized: true,
      permissions: ['feature_mapping_operation'],
    };

    const referenceRelationships = {
      dependencies: [
        {
          sourceLogicId: 'logic-001',
          targetLogicId: 'logic-002',
          type: 'aggregates',
        },
        {
          sourceLogicId: 'logic-002',
          targetLogicId: 'logic-001',
          type: 'none',
        },
        {
          sourceLogicId: 'logic-003',
          targetLogicId: 'logic-001',
          type: 'references',
        },
      ],
      hasCircularDependency: false,
    };

    // Mock の設定
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(projectContext);
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      userAuthorization
    );
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue(
      referenceRelationships
    );

    const input: MapCalculationLogicsToTargetSystemInput = {
      projectId,
      targetSystemId,
      userId,
      calculationLogics,
      targetSystemCapabilities,
      executionTimestamp,
    };

    // Act
    const result = await mapCalculationLogicsToTargetSystem(input);

    // Assert: mappingResults に 3 件の結果が含まれること
    expect(result.mappingResults).toHaveLength(3);

    // 各要素について個別難易度が記録されていることを確認
    const mapping001 = result.mappingResults.find((m) => m.calculationLogicId === 'logic-001');
    expect(mapping001).toBeDefined();
    expect(mapping001?.mappedCapabilityId).toBe('cap-001');
    expect(mapping001?.migrationComplexity).toBe('Low');

    const mapping002 = result.mappingResults.find((m) => m.calculationLogicId === 'logic-002');
    expect(mapping002).toBeDefined();
    expect(mapping002?.mappedCapabilityId).toBe('cap-002');
    expect(mapping002?.migrationComplexity).toBe('Medium');

    const mapping003 = result.mappingResults.find((m) => m.calculationLogicId === 'logic-003');
    expect(mapping003).toBeDefined();
    expect(mapping003?.mappedCapabilityId).toBe('cap-003');
    expect(mapping003?.migrationComplexity).toBe('High');

    // overallMigrationComplexity が 'High' であること（Low、Medium、High の中で最も高い）
    expect(result.overallMigrationComplexity).toBe('High');

    // overallMigrationRisk が 'High' 以上であること
    expect(['High', 'Critical']).toContain(result.overallMigrationRisk);

    // totalEstimatedEffort が 8.5 であること（1.0 + 2.5 + 5.0）
    expect(result.totalEstimatedEffort).toBe(8.5);

    // incompatibleLogicsCount が 0 であること
    expect(result.incompatibleLogicsCount).toBe(0);

    // mappingResults が 3 件であること
    expect(result.mappingResults).toHaveLength(3);

    // recommendedMitigationStrategies に複雑度の高いロジックに対する対応策が含まれること
    expect(Array.isArray(result.recommendedMitigationStrategies)).toBe(true);
    expect(result.recommendedMitigationStrategies.length).toBeGreaterThan(0);

    // executionTimestamp が '2026-10-08T10:00:00Z' であること
    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
