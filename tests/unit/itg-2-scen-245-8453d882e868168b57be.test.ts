import { searchMappingsByCondition, SearchMappingsByConditionOutput } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-245: Filter by risk level returns only matching mappings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter and return only mappings with specified risk level', async () => {
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
      targetSystemId: 'oracle-billing-system',
    });

    mockPersistenceModule.retrieveMappingDetailsForProject.mockResolvedValue([
      {
        mappingDetailId: 'map-001',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-billing-system',
        existingFunctionName: '請求書作成',
        mappingTargetObjectId: 'target-001',
        mappingMethod: 'direct_mapping',
        migrationStatus: '進行中',
        priority: 1,
        verificationStatus: 'pending',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-002',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-billing-system',
        existingFunctionName: '請求明細計算',
        mappingTargetObjectId: 'target-002',
        mappingMethod: 'direct_mapping',
        migrationStatus: '完了',
        priority: 2,
        verificationStatus: 'verified',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-003',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-billing-system',
        existingFunctionName: '税金計算',
        mappingTargetObjectId: 'target-003',
        mappingMethod: 'direct_mapping',
        migrationStatus: '計画中',
        priority: 3,
        complexity: '高',
        verificationStatus: 'pending',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-004',
        projectId: 'proj-migration-2026',
        targetSystemId: 'oracle-billing-system',
        existingFunctionName: '承認フロー',
        mappingTargetObjectId: 'target-004',
        mappingMethod: 'direct_mapping',
        migrationStatus: '進行中',
        priority: 4,
        complexity: '低',
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
        validationStatus: '検証中',
        gapClassification: '完全対応',
        gapScore: 100,
        riskLevel: '高',
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
        gapScore: 52,
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
        validationStatus: '未検証',
        gapClassification: '非対応',
        gapScore: 91,
        riskLevel: '高',
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
        validationStatus: '検証中',
        gapClassification: 'カスタマイズ必要',
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
        projectId: 'proj-migration-2026',
        riskClassification: 'tech-risk',
        riskItemName: 'map-001 risk',
        occurrencePossibilityLevel: '高',
        impactLevel: '高',
        riskEvaluationScore: 8.5,
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
        riskEvaluationScore: 5.2,
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
        occurrencePossibilityLevel: '高',
        impactLevel: '高',
        riskEvaluationScore: 9.1,
        remediationApproach: 'mitigation',
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
        occurrencePossibilityLevel: '低',
        impactLevel: '低',
        riskEvaluationScore: 2.8,
        remediationApproach: 'acceptance',
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
      targetSystemId: 'oracle-billing-system',
      riskLevel: '高',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await searchMappingsByCondition(input);

    expect(result.mappingTableRows).toHaveLength(2);
    expect(result.mappingTableRows[0].existingFunctionName).toBe('請求書作成');
    expect(result.mappingTableRows[0].migrationStatus).toBe('進行中');
    expect(result.mappingTableRows[0].gapClassification).toBe('完全対応');
    expect(result.mappingTableRows[0].riskLevel).toBe('高');
    expect(result.mappingTableRows[0].complexity).toBe('高');
    expect(result.mappingTableRows[0].validationStatus).toBe('検証中');
    expect(result.mappingTableRows[0].priority).toBe(1);
    expect(result.mappingTableRows[1].existingFunctionName).toBe('税金計算');
    expect(result.mappingTableRows[1].migrationStatus).toBe('計画中');
    expect(result.mappingTableRows[1].gapClassification).toBe('非対応');
    expect(result.mappingTableRows[1].riskLevel).toBe('高');
    expect(result.mappingTableRows[1].complexity).toBe('高');
    expect(result.mappingTableRows[1].validationStatus).toBe('未検証');
    expect(result.mappingTableRows[1].priority).toBe(3);
    expect(result.totalRowCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(2);
  });
});
