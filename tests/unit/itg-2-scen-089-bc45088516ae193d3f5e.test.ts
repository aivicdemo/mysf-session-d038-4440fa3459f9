import { assessMigrationRisksFromMapping, InvalidCalculationLogicMetadataError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataValidationRules from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-089: assessMigrationRisksFromMapping - Invalid Calculation Logic Metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidCalculationLogicMetadataError when calculation logic metadata is incomplete', async () => {
    const projectId = 'proj-20240115-001';
    const targetSystemId = 'oracle-erp-v12';
    const userId = 'user-20240115-admin-001';

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 35,
        validationStatus: 'VALIDATED',
        detectedIssues: ['カスタム計算項目の実装が必要'],
        recommendations: [],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Complete Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['Subtotal__c', 'Tax__c'],
        referencedFieldCount: 2,
        migrationRisk: 'MEDIUM',
      },
      {
        calculationLogicId: 'calc-002',
        logicName: 'Incomplete Calculation',
        logicType: null as any,
        migrationDifficulty: null as any,
        dependentLogicIds: null as any,
        referencedFieldCount: 0,
        migrationRisk: null as any,
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
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
        capabilityId: 'cap-001',
        functionName: '計算ロジック',
        functionCategory: 'CALCULATION',
        complexityLevel: 30,
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
      userRole: 'MIGRATION_MANAGER',
      isContextValid: true,
    });

    (dataValidationRules.validateCalculationLogicDefinitions as jest.Mock).mockRejectedValue(
      new InvalidCalculationLogicMetadataError('計算ロジックメタデータが無効です。')
    );

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
        userId,
      })
    ).rejects.toThrow(InvalidCalculationLogicMetadataError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
    expect(dataValidationRules.validateCalculationLogicDefinitions).toHaveBeenCalled();
  });
});
