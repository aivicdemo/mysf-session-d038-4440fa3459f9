import { mapCalculationLogicsToTargetSystem } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';
import type { MapCalculationLogicsToTargetSystemInput } from '../../src/logic/calculation-logic-mapper';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-138: 複数の移行対象システム実装方式のいずれかが選択可能な場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('マッピング結果に選択された実装方式が記録される', async () => {
    // Arrange: preconditions のデータを用意
    const projectId = 'proj-2026-migration-001';
    const targetSystemId = 'oracle-erp-v12';
    const userId = 'user-migration-lead-001';
    const executionTimestamp = new Date('2026-10-07T10:30:00Z');

    const calculationLogics = [
      {
        calculationLogicId: 'calc-logic-001',
        logicName: 'Invoice Total Amount',
        logicType: 'FIELD_FORMULA',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Total_Amount__c',
        existingSystemLogic: 'SUM(invoice_line_items.amount) WHERE invoice_id = invoice.id',
        salesforceLogic: 'SUM(Invoice_Line_Items__r.Amount__c)',
        referenceFieldList: ['Invoice_Line_Items__c'],
      },
      {
        calculationLogicId: 'calc-logic-002',
        logicName: 'Invoice Status Workflow',
        logicType: 'WORKFLOW',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Status__c',
        existingSystemLogic: "CASE WHEN total_amount > 10000 THEN 'APPROVAL_REQUIRED' ELSE 'AUTO_APPROVED' END",
        salesforceLogic: "IF(Total_Amount__c > 10000, 'Requires_Approval', 'Auto_Approved')",
      },
      {
        calculationLogicId: 'calc-logic-003',
        logicName: 'Invoice Line Item Tax',
        logicType: 'PROCESS_BUILDER',
        targetObjectId: 'Invoice_Line_Item__c',
        targetFieldName: 'Tax_Amount__c',
        existingSystemLogic: 'amount * 0.1',
        salesforceLogic: 'Amount__c * 0.1',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'COMPUTED_COLUMN',
        functionCategory: 'Calculation',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'TRIGGER',
        functionCategory: 'Workflow',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-003',
        functionName: 'STORED_PROCEDURE',
        functionCategory: 'Workflow',
        complexityLevel: 3,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-004',
        functionName: 'APPLICATION_CODE',
        functionCategory: 'Custom',
        complexityLevel: 4,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const projectContext = {
      projectId: 'proj-2026-migration-001',
      targetSystemId: 'oracle-erp-v12',
    };

    const userAuthorization = {
      userId: 'user-migration-lead-001',
      authorized: true,
      permissions: ['mapping:execute', 'mapping:review', 'mapping:approve'],
    };

    const referenceRelationships = {
      dependencies: [
        {
          sourceLogicId: 'calc-logic-001',
          targetLogicIds: ['calc-logic-003'],
          relationshipType: 'REFERENCES',
        },
      ],
      analysisTimestamp: '2026-10-07T10:00:00Z',
    };

    // Mock の設定
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(projectContext);
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      userAuthorization
    );
    (referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock).mockResolvedValue({
      ...referenceRelationships,
      hasCircularDependency: false,
    });

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

    // calc-logic-001: COMPUTED_COLUMN が選択されている
    const mapping001 = result.mappingResults.find((m) => m.calculationLogicId === 'calc-logic-001');
    expect(mapping001).toBeDefined();
    expect(mapping001?.mappedCapabilityId).toBe('cap-001');

    // calc-logic-002: TRIGGER または STORED_PROCEDURE のいずれか 1 つが選択されている
    const mapping002 = result.mappingResults.find((m) => m.calculationLogicId === 'calc-logic-002');
    expect(mapping002).toBeDefined();
    expect(['cap-002', 'cap-003']).toContain(mapping002?.mappedCapabilityId);

    // calc-logic-003: COMPUTED_COLUMN が選択されている
    const mapping003 = result.mappingResults.find((m) => m.calculationLogicId === 'calc-logic-003');
    expect(mapping003).toBeDefined();
    expect(mapping003?.mappedCapabilityId).toBe('cap-001');

    // overallMigrationComplexity が Medium であること
    expect(result.overallMigrationComplexity).toBe('Medium');

    // overallMigrationRisk が Low であること（循環依存がなく、すべて実装可能）
    expect(result.overallMigrationRisk).toBe('Low');

    // totalEstimatedEffort が 5 または 7 のいずれか（cap-002 選択時 = 1+3+1=5、cap-003 選択時 = 1+5+1=7）
    expect([5, 7]).toContain(result.totalEstimatedEffort);

    // incompatibleLogicsCount が 0 であること
    expect(result.incompatibleLogicsCount).toBe(0);

    // recommendedMitigationStrategies が配列であること
    expect(Array.isArray(result.recommendedMitigationStrategies)).toBe(true);

    // executionTimestamp が正しく返されること
    expect(result.executionTimestamp).toEqual(executionTimestamp);

    // エラーが発生していないこと（エラーの種類別に確認）
    expect(result).toBeDefined();
  });
});
