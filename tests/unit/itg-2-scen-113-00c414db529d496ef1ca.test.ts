import { assessMigrationRisksFromMapping, InvalidCalculationLogicMetadataError } from '../../src/logic/risk-assessment-service';
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

describe('SCEN-113: 計算ロジックメタデータが不完全の場合のエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      authorized: true,
      roles: ['リスク評価実行権限'],
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'target-sys-001',
      accessLevel: 'read-write',
    });

    (validationModule.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      valid: false,
      errors: ['計算ロジックメタデータが不完全'],
    });

    (validationModule.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });

    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });
  });

  it('should throw InvalidCalculationLogicMetadataError when calculation logic metadata is incomplete', async () => {
    const input = {
      projectId: 'proj-001',
      targetSystemId: 'target-sys-001',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: '機能',
          gapCategory: 'part_match',
          gapScore: 45,
          validationStatus: 'review_needed',
          detectedIssues: [],
          recommendations: ['カスタム開発で対応'],
          riskLevel: '中',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: 'ロジック',
          logicType: 'formula',
          migrationDifficulty: '高',
          dependentLogicIds: [],
          referencedFieldCount: 3,
          migrationRisk: 'risk',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'ref-001',
          sourceObjectName: 'Obj1',
          targetObjectName: 'Obj2',
          referenceFieldName: 'ref',
          cardinality: '1:N',
          isRequired: false,
          deleteAction: 'restrict',
          isPartOfCircularDependency: false,
        },
      ],
      targetSystemCapabilities: [
        {
          capabilityId: 'cap-001',
          functionName: '請求書生成',
          functionCategory: 'billing',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
      userId: 'user-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(InvalidCalculationLogicMetadataError);
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow('計算ロジックメタデータが無効です。');
  });
});
