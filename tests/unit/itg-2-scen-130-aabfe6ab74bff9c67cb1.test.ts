import { mapCalculationLogicsToTargetSystem, InvalidCalculationLogicDefinitionError } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-130: InvalidCalculationLogicDefinitionError when calculation logic is invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidCalculationLogicDefinitionError when calculation logic has null fieldName and salesforceLogic', async () => {
    const projectId = 'proj-20250107-001';
    const targetSystemId = 'tgt-oracle-erp-001';
    const userId = 'user-migration-lead-001';
    const executionTimestamp = new Date('2025-01-07T10:30:00.000Z');

    const calculationLogics = [
      {
        calculationLogicId: 'logic-001',
        logicName: 'InvoiceTotalAmount',
        logicType: 'FieldFormula',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SUM(InvoiceLineItem__c.LineAmount__c)',
        salesforceLogic: 'ROLLUP(InvoiceLineItem__c, SUM, Amount__c)',
        logicDescription: '請求書合計額',
      },
      {
        calculationLogicId: 'logic-002',
        logicName: 'ApprovalNotification',
        logicType: 'WorkflowRule',
        targetObjectId: 'Invoice__c',
        targetFieldName: null as any,
        existingSystemLogic: "IF Status = 'Approved' THEN send notification",
        salesforceLogic: null as any,
        logicDescription: '承認時の通知ルール',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-field-calc',
        functionName: 'FieldCalculation',
        functionCategory: 'FieldCalculation',
        complexityLevel: 1,
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

    await expect(
      mapCalculationLogicsToTargetSystem({
        projectId,
        targetSystemId,
        userId,
        calculationLogics,
        targetSystemCapabilities,
        executionTimestamp,
      })
    ).rejects.toThrow(InvalidCalculationLogicDefinitionError);

    await expect(
      mapCalculationLogicsToTargetSystem({
        projectId,
        targetSystemId,
        userId,
        calculationLogics,
        targetSystemCapabilities,
        executionTimestamp,
      })
    ).rejects.toThrow('計算ロジック定義が不正です。ロジック種別、対象オブジェクト、対象フィールド、既存システムロジック、Salesforceロジックは必須です。');
  });
});
