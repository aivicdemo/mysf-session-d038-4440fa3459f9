import { assessMigrationRisksFromMapping, InvalidObjectReferenceMetadataError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataValidationRules from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-090: assessMigrationRisksFromMapping - Invalid Object Reference Metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidObjectReferenceMetadataError when object reference metadata has null required field', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'target-sys-001';
    const userId = 'user-123';

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CALCULATION_LOGIC_MISSING',
        gapScore: 85,
        validationStatus: 'VALIDATED',
        detectedIssues: ['Implement custom calculation in target system'],
        recommendations: [],
        riskLevel: 'HIGH',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Complex Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['field-001', 'field-002'],
        referencedFieldCount: 2,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: null as any,
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: '1:N',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'Master-Detail Relationships',
        functionCategory: 'RELATIONSHIP',
        complexityLevel: 50,
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
      userRole: 'MappingEngineer',
      isContextValid: true,
    });

    (dataValidationRules.validateObjectReferenceRelationships as jest.Mock).mockRejectedValue(
      new InvalidObjectReferenceMetadataError('オブジェクト参照関係メタデータが無効です。')
    );

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2024-12-15T10:30:00Z'),
        userId,
      })
    ).rejects.toThrow(InvalidObjectReferenceMetadataError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
    expect(dataValidationRules.validateObjectReferenceRelationships).toHaveBeenCalled();
  });
});
