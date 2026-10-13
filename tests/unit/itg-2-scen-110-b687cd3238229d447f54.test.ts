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

describe('SCEN-110: 年間運用保守費が負数の場合のエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      authorized: true,
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      accessible: true,
    });
  });

  it('should throw RiskAssessmentCalculationError when annual maintenance cost is negative', async () => {
    const input = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: '機能',
          gapCategory: '機能ギャップ',
          gapScore: 45,
          validationStatus: '検証済',
          detectedIssues: [],
          recommendations: ['カスタム開発が必要'],
          riskLevel: '中',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: '計算ロジック',
          logicType: 'formula',
          migrationDifficulty: '高',
          dependentLogicIds: [],
          referencedFieldCount: 3,
          migrationRisk: '年間運用保守費が負数',
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
          functionName: '請求書管理',
          functionCategory: 'billing',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-12-15T10:00:00Z'),
      userId: 'user-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(RiskAssessmentCalculationError);
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow('リスク評価の計算に失敗しました。');
  });
});
