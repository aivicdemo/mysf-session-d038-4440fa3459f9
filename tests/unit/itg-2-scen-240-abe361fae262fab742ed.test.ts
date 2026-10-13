import { searchMappingsByCondition, DataRetrievalError } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-240: DataRetrievalError when mapping details retrieval fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataRetrievalError when retrieveMappingDetailsForProject throws', async () => {
    const mockAuthModule = jest.mocked(authModule);
    const mockProjectModule = jest.mocked(projectModule);
    const mockPersistenceModule = jest.mocked(persistenceModule);

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      operationType: 'search_mapping',
      projectId: 'proj-migration-2024',
    });

    mockProjectModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-2024',
      targetSystemId: 'target-oracle-billing',
    });

    mockPersistenceModule.retrieveMappingDetailsForProject.mockRejectedValue(
      new Error('Database connection failed')
    );

    mockPersistenceModule.retrieveMappingValidationResultsForProject.mockResolvedValue([
      {
        validationResultId: 'val-001',
        projectId: 'proj-migration-2024',
        mappingDetailId: 'map-001',
        validationStatus: '検証完了',
        gapClassification: '完全対応',
        gapScore: 100,
        riskLevel: '低',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'validator-001',
      },
    ]);

    mockPersistenceModule.retrieveMigrationRiskAssessmentsForProject.mockResolvedValue([
      {
        riskAssessmentId: 'risk-001',
        projectId: 'proj-migration-2024',
        riskClassification: 'tech-risk',
        riskItemName: 'Data Migration Risk',
        occurrencePossibilityLevel: '低',
        impactLevel: '低',
        riskEvaluationScore: 2,
        remediationApproach: 'mitigation',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'assessor-001',
      },
    ]);

    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2024',
      targetSystemId: 'target-oracle-billing',
      pageNumber: 1,
      pageSize: 10,
    };

    await expect(searchMappingsByCondition(input)).rejects.toThrow(DataRetrievalError);
    await expect(searchMappingsByCondition(input)).rejects.toThrow(
      'マッピングデータの取得に失敗しました。'
    );
  });
});
