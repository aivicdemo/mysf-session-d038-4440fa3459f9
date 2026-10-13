import { searchMappingsByCondition, SearchMappingsByConditionOutput } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-244: Filter by gap classification returns only matching mappings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter and return only mappings with specified gap classification', async () => {
    const mockAuthModule = jest.mocked(authModule);
    const mockProjectModule = jest.mocked(projectModule);
    const mockPersistenceModule = jest.mocked(persistenceModule);

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      operationType: 'search_mapping',
      projectId: 'project-sf-migration-001',
    });

    mockProjectModule.resolveProjectContext.mockResolvedValue({
      projectId: 'project-sf-migration-001',
      targetSystemId: 'target-oracle-billing-001',
    });

    mockPersistenceModule.retrieveMappingDetailsForProject.mockResolvedValue([
      {
        mappingDetailId: 'map-001',
        projectId: 'project-sf-migration-001',
        targetSystemId: 'target-oracle-billing-001',
        existingFunctionName: '請求書ヘッダ取得',
        mappingTargetObjectId: 'target-001',
        mappingMethod: 'direct_mapping',
        migrationStatus: '完了',
        complexity: '中',
        verificationStatus: 'verified',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-002',
        projectId: 'project-sf-migration-001',
        targetSystemId: 'target-oracle-billing-001',
        existingFunctionName: '請求明細一覧',
        mappingTargetObjectId: 'target-002',
        mappingMethod: 'direct_mapping',
        migrationStatus: '進行中',
        complexity: '高',
        verificationStatus: 'pending',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: 'map-003',
        projectId: 'project-sf-migration-001',
        targetSystemId: 'target-oracle-billing-001',
        existingFunctionName: '承認フロー',
        mappingTargetObjectId: 'target-003',
        mappingMethod: 'direct_mapping',
        migrationStatus: '計画中',
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
        projectId: 'project-sf-migration-001',
        mappingDetailId: 'map-001',
        validationStatus: '検証完了',
        gapClassification: '完全対応',
        gapScore: 1.5,
        riskLevel: '低',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-002',
        projectId: 'project-sf-migration-001',
        mappingDetailId: 'map-002',
        validationStatus: '検証中',
        gapClassification: '部分対応',
        gapScore: 5.0,
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
        projectId: 'project-sf-migration-001',
        mappingDetailId: 'map-003',
        validationStatus: '未検証',
        gapClassification: '部分対応',
        gapScore: 8.5,
        riskLevel: '高',
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
        projectId: 'project-sf-migration-001',
        riskClassification: 'tech-risk',
        riskItemName: 'map-001 risk',
        occurrencePossibilityLevel: '低',
        impactLevel: '低',
        riskEvaluationScore: 1.5,
        remediationApproach: 'acceptance',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-13T00:00:00Z',
        createdAt: '2026-10-13T00:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-13T00:00:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-002',
        projectId: 'project-sf-migration-001',
        riskClassification: 'tech-risk',
        riskItemName: 'map-002 risk',
        occurrencePossibilityLevel: '中',
        impactLevel: '中',
        riskEvaluationScore: 5.0,
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
        projectId: 'project-sf-migration-001',
        riskClassification: 'tech-risk',
        riskItemName: 'map-003 risk',
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
    ]);

    const input = {
      userId: 'user-001',
      projectId: 'project-sf-migration-001',
      targetSystemId: 'target-oracle-billing-001',
      gapClassification: '部分対応',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await searchMappingsByCondition(input);

    expect(result.mappingTableRows).toHaveLength(2);
    expect(result.mappingTableRows[0].existingFunctionName).toBe('請求明細一覧');
    expect(result.mappingTableRows[0].gapClassification).toBe('部分対応');
    expect(result.mappingTableRows[0].migrationStatus).toBe('進行中');
    expect(result.mappingTableRows[0].riskLevel).toBe('中');
    expect(result.mappingTableRows[0].validationStatus).toBe('検証中');
    expect(result.mappingTableRows[0].complexity).toBe('高');
    expect(result.mappingTableRows[1].existingFunctionName).toBe('承認フロー');
    expect(result.mappingTableRows[1].gapClassification).toBe('部分対応');
    expect(result.mappingTableRows[1].migrationStatus).toBe('計画中');
    expect(result.mappingTableRows[1].riskLevel).toBe('高');
    expect(result.mappingTableRows[1].validationStatus).toBe('未検証');
    expect(result.mappingTableRows[1].complexity).toBe('低');
    expect(result.totalRowCount).toBe(2);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(2);
  });
});
