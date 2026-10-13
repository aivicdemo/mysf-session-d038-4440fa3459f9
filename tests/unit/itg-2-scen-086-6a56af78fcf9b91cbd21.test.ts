import { assessMigrationRisksFromMapping, UnauthorizedAccessError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-086: assessMigrationRisksFromMapping - Unauthorized Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when user is not authenticated', async () => {
    const projectId = 'PROJ-2024-001';
    const targetSystemId = 'TGSYS-ORACLE-ERP';
    const userId = 'USER-UNAUTHENTICATED';

    const mappingValidationResults = [
      {
        mappingDetailId: 'MAP-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 75,
        validationStatus: 'VALIDATED',
        detectedIssues: ['カスタム開発が必要'],
        recommendations: [],
        riskLevel: 'HIGH',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'CALC-001',
        logicName: 'Complex Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['dep-1', 'dep-2', 'dep-3'],
        referencedFieldCount: 3,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'REF-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'CAP-001',
        functionName: '請求書承認フロー',
        functionCategory: 'WORKFLOW',
        complexityLevel: 50,
        isMappingTarget: false,
        dependentCapabilityIds: [],
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new UnauthorizedAccessError('ユーザーの認証またはロール権限が不足しています。')
    );

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2024-12-20T10:30:00Z'),
        userId,
      })
    ).rejects.toThrow(UnauthorizedAccessError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
  });
});
