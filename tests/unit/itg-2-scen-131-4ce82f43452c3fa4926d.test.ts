import { mapCalculationLogicsToTargetSystem, TargetSystemCapabilitiesNotProvidedError } from '../../src/logic/calculation-logic-mapper';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as referenceAnalyzer from '../../src/logic/reference-relationship-analyzer';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/reference-relationship-analyzer');

describe('SCEN-131: TargetSystemCapabilitiesNotProvidedError when target system capabilities are empty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw TargetSystemCapabilitiesNotProvidedError when targetSystemCapabilities is empty', async () => {
    const projectId = 'proj-sf-migration-2026';
    const targetSystemId = 'target-oracle-erp-001';
    const userId = 'user-mapper-001';
    const executionTimestamp = new Date('2026-10-07T10:30:00.000Z');

    const calculationLogics = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'InvoiceTotal',
        logicType: 'FieldCalculation',
        targetObjectId: 'Invoice__c',
        targetFieldName: 'TotalAmount__c',
        existingSystemLogic: 'SUM(invoice_lines.amount)',
        salesforceLogic: 'Invoice_Line__r.Amount__c',
      },
    ];

    const targetSystemCapabilities: any[] = [];

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
    ).rejects.toThrow(TargetSystemCapabilitiesNotProvidedError);

    await expect(
      mapCalculationLogicsToTargetSystem({
        projectId,
        targetSystemId,
        userId,
        calculationLogics,
        targetSystemCapabilities,
        executionTimestamp,
      })
    ).rejects.toThrow('移行対象システムの計算ロジック実装方式を指定してください。');
  });
});
