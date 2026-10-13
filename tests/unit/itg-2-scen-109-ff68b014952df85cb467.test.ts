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

describe('SCEN-109: 年間ライセンス料が負数の場合のエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId: 'user-12345',
      isAuthenticated: true,
      role: 'ProjectManager',
      hasPermission: true,
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-20240115-001',
      targetSystemId: 'oracle-erp-system-01',
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

  it('should throw RiskAssessmentCalculationError when annual license cost is negative', async () => {
    const input = {
      projectId: 'proj-20240115-001',
      targetSystemId: 'oracle-erp-system-01',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: '請求書管理',
          gapCategory: '機能ギャップ',
          gapScore: 75,
          validationStatus: '検証済',
          detectedIssues: [],
          recommendations: ['カスタム開発が必要'],
          riskLevel: '高',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: 'TCO計算',
          logicType: 'formula',
          migrationDifficulty: '高',
          dependentLogicIds: [],
          referencedFieldCount: 3,
          migrationRisk: '年間ライセス料が負数になる可能性',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'ref-001',
          sourceObjectName: 'Invoice__c',
          targetObjectName: 'Account',
          referenceFieldName: 'Account__r',
          cardinality: '1:N',
          isRequired: false,
          deleteAction: 'restrict',
          isPartOfCircularDependency: false,
        },
      ],
      targetSystemCapabilities: [
        {
          capabilityId: 'cap-001',
          functionName: '請求書管理',
          functionCategory: '請求',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
      userId: 'user-12345',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(RiskAssessmentCalculationError);
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow('リスク評価の計算に失敗しました。');
  });
});
