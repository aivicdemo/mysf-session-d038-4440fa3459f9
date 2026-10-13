import { mapCalculationLogicsToTargetSystem, UnauthorizedUserError } from '../../src/logic/calculation-logic-mapper';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-128: UnauthorizedUserError when user lacks feature mapping permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedUserError when user lacks mapping permission', async () => {
    const projectId = 'proj-migration-2026-001';
    const targetSystemId = 'target-oracle-erp-001';
    const userId = 'user-mapper-001';
    const executionTimestamp = new Date('2026-10-08T10:00:00.000Z');

    const calculationLogics = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'InvoiceTotal',
        logicType: 'FormulaField',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'Total_Amount__c',
        existingSystemLogic: 'TOTAL_AMOUNT = INVOICE_AMOUNT + TAX_AMOUNT',
        salesforceLogic: 'Amount__c + Tax__c',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'ComputedColumn',
        functionCategory: 'ComputedColumn',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      userRole: 'viewer',
      isContextValid: true,
    });

    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: false,
      userId,
      operationType: 'mapping-calculation-logics',
      denialReason: 'ユーザーは機能マッピング操作を実行する権限がありません。',
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
        processingTimeMs: 50,
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
    ).rejects.toThrow(UnauthorizedUserError);

    await expect(
      mapCalculationLogicsToTargetSystem({
        projectId,
        targetSystemId,
        userId,
        calculationLogics,
        targetSystemCapabilities,
        executionTimestamp,
      })
    ).rejects.toThrow('ユーザーは機能マッピング操作を実行する権限がありません。');
  });
});
