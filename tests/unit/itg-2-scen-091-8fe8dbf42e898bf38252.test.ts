import { assessMigrationRisksFromMapping, InvalidTargetSystemCapabilitiesError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataValidationRules from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-091: assessMigrationRisksFromMapping - Invalid Target System Capabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidTargetSystemCapabilitiesError when target system capabilities are incomplete', async () => {
    const projectId = 'proj-migration-001';
    const targetSystemId = 'oracle-erp-001';
    const userId = 'user-001';

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 45,
        validationStatus: 'VALIDATED',
        detectedIssues: ['カスタマイズ必要'],
        recommendations: [],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: '請求金額合計',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: [],
        referencedFieldCount: 2,
        migrationRisk: 'MEDIUM',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Invoice_Line__c',
        referenceFieldName: 'InvoiceLineId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: null as any,
        functionName: '請求機能',
        functionCategory: 'BILLING',
        complexityLevel: 50,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: '請求明細機能',
        functionCategory: 'BILLING',
        complexityLevel: 40,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: userId,
      operationType: 'assess_migration_risks',
      projectId: projectId,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: projectId,
      targetSystemId: targetSystemId,
      userId: userId,
      userRole: 'プロジェクトマネージャー',
      isContextValid: true,
    });

    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockRejectedValue(
      new InvalidTargetSystemCapabilitiesError('移行対象システムの機能情報が無効です。')
    );

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2026-10-07T10:00:00Z'),
        userId,
      })
    ).rejects.toThrow(InvalidTargetSystemCapabilitiesError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
    expect(dataValidationRules.validateStandardFunctionMappings).toHaveBeenCalled();
  });
});
