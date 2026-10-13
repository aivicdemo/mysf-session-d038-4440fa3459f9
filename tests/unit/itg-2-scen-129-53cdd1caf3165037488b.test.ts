import { mapCalculationLogicsToTargetSystem, ProjectContextNotResolvedError } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-129: ProjectContextNotResolvedError when project context cannot be resolved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextNotResolvedError when project context is null', async () => {
    const projectId = 'proj-sf-migration-001';
    const targetSystemId = 'target-sys-oracle-001';
    const userId = 'user-001';
    const executionTimestamp = new Date('2026-10-07T12:00:00Z');

    const calculationLogics = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'InvoiceTotalAmount',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SUM(InvoiceLineItem__r.LineAmount__c)',
        salesforceLogic: 'SUM(InvoiceLineItem__r.Amount__c)',
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'FieldCalculation',
        functionCategory: 'FieldCalculation',
        complexityLevel: 1,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(null);

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
    ).rejects.toThrow(ProjectContextNotResolvedError);

    await expect(
      mapCalculationLogicsToTargetSystem({
        projectId,
        targetSystemId,
        userId,
        calculationLogics,
        targetSystemCapabilities,
        executionTimestamp,
      })
    ).rejects.toThrow('プロジェクトコンテキストが確定できません。プロジェクトと移行対象システムを選択してください。');
  });
});
