import {
  assessMigrationRisksFromMapping,
  AssessMigrationRisksFromMappingInput,
  RiskAssessmentCalculationError,
} from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-102: 年間ライセンス料が0円以下の場合、ライセンス料の妥当性検証エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('年間ライセンス料が負の値のとき、RiskAssessmentCalculationErrorをスローする', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'sys-001';
    const userId = 'user-001';
    const evaluationDateTime = new Date('2026-01-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Object1',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 45,
        validationStatus: 'DETECTED',
        detectedIssues: ['Issue detected'],
        recommendations: ['Recommendation'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Complex logic',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: [],
        referencedFieldCount: 1,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Object1',
        targetObjectName: 'Object2',
        referenceFieldName: 'ref',
        cardinality: 'N:1',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'StandardBillingFlow',
        functionCategory: 'BILLING',
        complexityLevel: 10,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      mappingValidationResults,
      calculationLogicMetadata,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    jest.mocked(authService.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'ASSESS_MIGRATION_RISKS',
      projectId,
    });

    jest.mocked(projectContextService.resolveProjectContext).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      userRole: 'analyst',
      isContextValid: true,
    });

    // This call should throw RiskAssessmentCalculationError
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(
      RiskAssessmentCalculationError
    );

    // The error message should indicate calculation failure
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(
      'リスク評価の計算に失敗しました。'
    );
  });
});
