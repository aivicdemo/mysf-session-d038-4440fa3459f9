import { assessMigrationRisksFromMapping, RiskAssessmentCalculationError } from '../../src/logic/risk-assessment-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));
jest.mock('../../src/logic/data-validation-rules', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-validation-rules')>('../../src/logic/data-validation-rules'),
  validateCalculationLogicDefinitions: jest.fn(),
  validateObjectReferenceRelationships: jest.fn(),
  validateStandardFunctionMappings: jest.fn(),
}));

describe('SCEN-112: 税率が範囲外の場合のエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-001',
      hasPermission: true,
      role: 'PROJECT_MANAGER',
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      isValid: true,
      userHasAccess: true,
    });

    (validationModule.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    (validationModule.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
    });

    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: [],
    });
  });

  it('should throw error with message when tax rate is out of range', async () => {
    const input = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      mappingValidationResults: [
        {
          mappingDetailId: 'MAP-001',
          existingFunctionName: '請求書生成',
          gapCategory: 'CRITICAL',
          gapScore: 8.5,
          validationStatus: '検証済',
          detectedIssues: [],
          recommendations: ['カスタム計算ロジック実装が必要'],
          riskLevel: '極高',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'CALC-001',
          logicName: 'TCO計算',
          logicType: 'formula',
          migrationDifficulty: '高',
          dependentLogicIds: [],
          referencedFieldCount: 3,
          migrationRisk: '税率パラメータ',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'REF-001',
          sourceObjectName: 'Obj1',
          targetObjectName: 'Obj2',
          referenceFieldName: 'ref',
          cardinality: 'MEDIUM',
          isRequired: false,
          deleteAction: 'restrict',
          isPartOfCircularDependency: false,
        },
      ],
      targetSystemCapabilities: [
        {
          capabilityId: 'CAP-001',
          functionName: '請求書生成',
          functionCategory: 'billing',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2026-10-07T10:00:00Z'),
      userId: 'user-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(RiskAssessmentCalculationError);
    const err = await assessMigrationRisksFromMapping(input).catch((e: any) => e);
    expect(err.message).toContain('リスク評価の計算に失敗しました。');
  });
});
