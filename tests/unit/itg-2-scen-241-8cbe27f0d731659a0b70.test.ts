import { searchMappingsByCondition, SearchMappingsByConditionOutput } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-241: Multiple search conditions filter to matching mappings only', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter and return only mappings matching all conditions', async () => {
    const mockAuthModule = jest.mocked(authModule);
    const mockProjectModule = jest.mocked(projectModule);
    const mockPersistenceModule = jest.mocked(persistenceModule);

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      operationType: 'search_mapping',
      projectId: 'proj-migration-2026',
    });

    mockProjectModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-2026',
      targetSystemId: 'oracle-erp-prod',
    });

    mockPersistenceModule.retrieveMappingDetailsForProject.mockResolvedValue([
      {
        mappingDetailId: 'map-001',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-erp-prod',
        existingFunctionName: '請求書作成',
        mappingTargetObjectId: 'target-001',
        mappingMethod: 'direct_mapping',
        migrationStatus: '進行中',
        priority: 3,
        complexity: '高',
        verificationStatus: 'pending',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-002',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-erp-prod',
        existingFunctionName: '請求書承認',
        mappingTargetObjectId: 'target-002',
        mappingMethod: 'direct_mapping',
        migrationStatus: '進行中',
        priority: 4,
        complexity: '高',
        verificationStatus: 'pending',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-003',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-erp-prod',
        existingFunctionName: '請求明細',
        mappingTargetObjectId: 'target-003',
        mappingMethod: 'direct_mapping',
        migrationStatus: '完了',
        priority: 2,
        complexity: '低',
        verificationStatus: 'verified',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-004',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-erp-prod',
        existingFunctionName: '請求書検索',
        mappingTargetObjectId: 'target-004',
        mappingMethod: 'direct_mapping',
        migrationStatus: '進行中',
        priority: 3,
        complexity: '高',
        verificationStatus: 'pending',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
    ]);

    mockPersistenceModule.retrieveMappingValidationResultsForProject.mockResolvedValue([
      {
        validationResultId: 'val-001',
        projectId: 'proj-migration-2026',
        mappingDetailId: 'map-001',
        validationStatus: '検証完了',
        gapClassification: '部分対応',
        gapScore: 75,
        riskLevel: '中',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-002',
        projectId: 'proj-migration-2026',
        mappingDetailId: 'map-002',
        validationStatus: '検証完了',
        gapClassification: '部分対応',
        gapScore: 75,
        riskLevel: '中',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-003',
        projectId: 'proj-migration-2026',
        mappingDetailId: 'map-003',
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
      {
        validationResultId: 'val-004',
        projectId: 'proj-migration-2026',
        mappingDetailId: 'map-004',
        validationStatus: '検証完了',
        gapClassification: '部分対応',
        gapScore: 75,
        riskLevel: '中',
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
        projectId: 'proj-migration-2026',
        riskClassification: 'tech-risk',
        riskItemName: 'map-001 risk',
        occurrencePossibilityLevel: '中',
        impactLevel: '中',
        riskEvaluationScore: 65,
        remediationApproach: 'mitigation',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-002',
        projectId: 'proj-migration-2026',
        riskClassification: 'tech-risk',
        riskItemName: 'map-002 risk',
        occurrencePossibilityLevel: '中',
        impactLevel: '中',
        riskEvaluationScore: 65,
        remediationApproach: 'mitigation',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-003',
        projectId: 'proj-migration-2026',
        riskClassification: 'tech-risk',
        riskItemName: 'map-003 risk',
        occurrencePossibilityLevel: '低',
        impactLevel: '低',
        riskEvaluationScore: 30,
        remediationApproach: 'acceptance',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-004',
        projectId: 'proj-migration-2026',
        riskClassification: 'tech-risk',
        riskItemName: 'map-004 risk',
        occurrencePossibilityLevel: '中',
        impactLevel: '中',
        riskEvaluationScore: 65,
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
      projectId: 'proj-migration-2026',
      targetSystemId: 'oracle-erp-prod',
      existingFunctionName: '請求書',
      mappingStatus: '進行中',
      gapClassification: '部分対応',
      riskLevel: '中',
      complexity: '高',
      validationStatus: '検証完了',
      priority: { min: 2, max: 4 },
      sortBy: 'priority',
      sortOrder: 'desc' as const,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await searchMappingsByCondition(input);

    expect(result.mappingTableRows).toHaveLength(3);
    expect(result.mappingTableRows[0].existingFunctionName).toBe('請求書承認');
    expect(result.mappingTableRows[0].priority).toBe(4);
    expect(result.mappingTableRows[1].existingFunctionName).toBe('請求書作成');
    expect(result.mappingTableRows[1].priority).toBe(3);
    expect(result.mappingTableRows[2].existingFunctionName).toBe('請求書検索');
    expect(result.mappingTableRows[2].priority).toBe(3);
    expect(result.totalRowCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(3);
  });
});
