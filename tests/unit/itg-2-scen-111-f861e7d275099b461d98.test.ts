import { assessMigrationRisksFromMapping, RiskAssessmentCalculationError } from '../../src/logic/risk-assessment-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

describe('SCEN-111: 割引率が範囲外の場合のエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
      userId: 'user-pm-001',
      role: 'ProjectManager',
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-20240115-001',
      targetSystemId: 'sys-oracle-erp-202401',
      userHasAccess: true,
    });
  });

  it('should throw RiskAssessmentCalculationError when discount rate is out of range', async () => {
    const input = {
      projectId: 'proj-20240115-001',
      targetSystemId: 'sys-oracle-erp-202401',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: '機能',
          gapCategory: 'カスタマイズ必要',
          gapScore: 85,
          validationStatus: '検証済',
          detectedIssues: [],
          recommendations: ['カスタム実装が必要'],
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
          migrationRisk: '割引率が範囲外',
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
          functionName: '標準請求機能',
          functionCategory: 'billing',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
      userId: 'user-pm-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(RiskAssessmentCalculationError);
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow('リスク評価の計算に失敗しました。');
  });
});
