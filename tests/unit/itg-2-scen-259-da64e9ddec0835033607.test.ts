import { aggregateMappingStatistics } from '../../src/logic/mapping-query-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextService from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-259: 認可済みユーザーが存在するプロジェクト・移行対象システムの統計情報を集計', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対応状況別・ギャップ分類別・リスク別・複雑度別の件数分布と検証カバレッジ統計が集計される', async () => {
    const userId = 'user-001';
    const projectId = 'project-migration-001';
    const targetSystemId = 'oracle-erp-system-001';

    // Mock authentication
    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'AGGREGATE_STATISTICS',
      projectId,
    });

    // Mock project context
    (contextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      userRole: 'ADMIN',
      isContextValid: true,
    });

    // Mock mapping details
    const mappingDetails = [
      {
        mappingDetailId: 'map-001',
        projectId,
        targetSystemId,
        existingFunctionName: 'Invoice.create',
        mappingTargetObjectId: 'AR_INVOICE_API',
        mappingMethod: 'DIRECT_MAPPING',
        migrationStatus: 'FULLY_MAPPED',
        priority: 1,
        complexity: 'SIMPLE',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: userId,
        updatedAt: '2026-10-01T00:00:00Z',
        updatedBy: userId,
      },
      {
        mappingDetailId: 'map-002',
        projectId,
        targetSystemId,
        existingFunctionName: 'Invoice.approve',
        mappingTargetObjectId: 'APPROVAL_FLOW',
        mappingMethod: 'PARTIAL_MAPPING',
        migrationStatus: 'PARTIALLY_MAPPED',
        priority: 2,
        complexity: 'MODERATE',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: userId,
        updatedAt: '2026-10-01T00:00:00Z',
        updatedBy: userId,
      },
      {
        mappingDetailId: 'map-003',
        projectId,
        targetSystemId,
        existingFunctionName: 'Invoice.calculateTax',
        mappingTargetObjectId: 'TAX_ENGINE',
        mappingMethod: 'CUSTOMIZATION_REQUIRED',
        migrationStatus: 'REQUIRES_CUSTOMIZATION',
        priority: 3,
        complexity: 'COMPLEX',
        verificationStatus: 'PENDING',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: userId,
        updatedAt: '2026-10-01T00:00:00Z',
        updatedBy: userId,
      },
      {
        mappingDetailId: 'map-004',
        projectId,
        targetSystemId,
        existingFunctionName: 'Invoice.multiCurrency',
        mappingTargetObjectId: null,
        mappingMethod: 'NOT_MAPPED',
        migrationStatus: 'NOT_MAPPED',
        priority: 4,
        complexity: 'VERY_COMPLEX',
        verificationStatus: 'NOT_VERIFIED',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: userId,
        updatedAt: '2026-10-01T00:00:00Z',
        updatedBy: userId,
      },
      {
        mappingDetailId: 'map-005',
        projectId,
        targetSystemId,
        existingFunctionName: 'InvoiceLine.validate',
        mappingTargetObjectId: 'LINE_VALIDATION',
        mappingMethod: 'DIRECT_MAPPING',
        migrationStatus: 'FULLY_MAPPED',
        priority: 1,
        complexity: 'SIMPLE',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-10-01T00:00:00Z',
        createdBy: userId,
        updatedAt: '2026-10-01T00:00:00Z',
        updatedBy: userId,
      },
    ];

    // Mock validation results
    const validationResults = [
      {
        validationResultId: 'val-001',
        projectId,
        mappingDetailId: 'map-001',
        validationStatus: 'VALIDATED',
        gapClassification: 'NO_GAP',
        gapScore: 0,
        riskLevel: 'LOW',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-05T10:00:00Z',
        createdAt: '2026-10-05T10:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-05T10:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-002',
        projectId,
        mappingDetailId: 'map-002',
        validationStatus: 'VALIDATED',
        gapClassification: 'FUNCTIONAL_GAP',
        gapScore: 50,
        riskLevel: 'MEDIUM',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-05T11:00:00Z',
        createdAt: '2026-10-05T11:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-05T11:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-003',
        projectId,
        mappingDetailId: 'map-003',
        validationStatus: 'PENDING',
        gapClassification: 'CUSTOMIZATION_REQUIRED',
        gapScore: 75,
        riskLevel: 'HIGH',
        validatorId: 'validator-001',
        validationTimestamp: null,
        createdAt: '2026-10-05T12:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-05T12:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-004',
        projectId,
        mappingDetailId: 'map-004',
        validationStatus: 'NOT_VALIDATED',
        gapClassification: 'NOT_SUPPORTED',
        gapScore: 100,
        riskLevel: 'CRITICAL',
        validatorId: 'validator-001',
        validationTimestamp: null,
        createdAt: '2026-10-05T13:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-05T13:00:00Z',
        updatedBy: 'validator-001',
      },
      {
        validationResultId: 'val-005',
        projectId,
        mappingDetailId: 'map-005',
        validationStatus: 'VALIDATED',
        gapClassification: 'NO_GAP',
        gapScore: 0,
        riskLevel: 'LOW',
        validatorId: 'validator-001',
        validationTimestamp: '2026-10-05T12:00:00Z',
        createdAt: '2026-10-05T14:00:00Z',
        createdBy: 'validator-001',
        updatedAt: '2026-10-05T14:00:00Z',
        updatedBy: 'validator-001',
      },
    ];

    // Mock risk assessments
    const riskAssessments = [
      {
        riskAssessmentId: 'risk-001',
        projectId,
        riskClassification: 'MAPPING_RISK',
        riskItemName: 'Risk-001',
        occurrencePossibilityLevel: 'LOW',
        impactLevel: 'LOW',
        riskEvaluationScore: 10,
        remediationApproach: 'MONITOR',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-04T09:00:00Z',
        createdAt: '2026-10-04T09:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-04T09:00:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-002',
        projectId,
        riskClassification: 'MAPPING_RISK',
        riskItemName: 'Risk-002',
        occurrencePossibilityLevel: 'MEDIUM',
        impactLevel: 'MEDIUM',
        riskEvaluationScore: 45,
        remediationApproach: 'MITIGATE',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-04T09:15:00Z',
        createdAt: '2026-10-04T09:15:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-04T09:15:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-003',
        projectId,
        riskClassification: 'MAPPING_RISK',
        riskItemName: 'Risk-003',
        occurrencePossibilityLevel: 'HIGH',
        impactLevel: 'HIGH',
        riskEvaluationScore: 78,
        remediationApproach: 'MITIGATE',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-04T09:30:00Z',
        createdAt: '2026-10-04T09:30:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-04T09:30:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-004',
        projectId,
        riskClassification: 'MAPPING_RISK',
        riskItemName: 'Risk-004',
        occurrencePossibilityLevel: 'CRITICAL',
        impactLevel: 'CRITICAL',
        riskEvaluationScore: 95,
        remediationApproach: 'AVOID',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-04T09:45:00Z',
        createdAt: '2026-10-04T09:45:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-04T09:45:00Z',
        updatedBy: 'assessor-001',
      },
      {
        riskAssessmentId: 'risk-005',
        projectId,
        riskClassification: 'MAPPING_RISK',
        riskItemName: 'Risk-005',
        occurrencePossibilityLevel: 'LOW',
        impactLevel: 'LOW',
        riskEvaluationScore: 12,
        remediationApproach: 'MONITOR',
        assessorId: 'assessor-001',
        assessmentTimestamp: '2026-10-04T10:00:00Z',
        createdAt: '2026-10-04T10:00:00Z',
        createdBy: 'assessor-001',
        updatedAt: '2026-10-04T10:00:00Z',
        updatedBy: 'assessor-001',
      },
    ];

    (persistenceService.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mappingDetails);
    (persistenceService.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(validationResults);
    (persistenceService.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(riskAssessments);

    const result = await aggregateMappingStatistics({
      userId,
      projectId,
      targetSystemId,
    });

    // Verify the result
    expect(result.totalMappings).toBe(5);
    expect(result.mappingStatusDistribution).toEqual({
      completeCount: 2,
      partialCount: 1,
      customizationRequiredCount: 1,
      nonMappingCount: 1,
    });
    expect(result.gapClassificationDistribution).toEqual({
      completeMappingCount: 2,
      partialMappingCount: 1,
      customizationRequiredCount: 1,
      nonMappingCount: 1,
      averageGapScore: 45,
      minGapScore: 0,
      maxGapScore: 100,
    });
    expect(result.riskDistribution).toEqual({
      lowRiskCount: 2,
      mediumRiskCount: 1,
      highRiskCount: 1,
      criticalRiskCount: 1,
      noRiskCount: 0,
      averageRiskScore: 48,
      minRiskScore: 10,
      maxRiskScore: 95,
    });
    expect(result.complexityDistribution).toEqual({
      lowCount: 2,
      mediumCount: 1,
      highCount: 1,
      veryHighCount: 1,
    });
    expect(result.validationCoverageStatistics).toEqual({
      totalValidatedCount: 3,
      validationCoveragePercentage: 60,
      passedValidationCount: 3,
      failedValidationCount: 0,
      pendingValidationCount: 1,
    });
    expect(result.aggregationTimestamp).toBeDefined();

    // Verify that dependencies were called
    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(contextService.resolveProjectContext).toHaveBeenCalled();
    expect(persistenceService.retrieveMappingDetailsForProject).toHaveBeenCalledWith({
      projectId,
    });
    expect(persistenceService.retrieveMappingValidationResultsForProject).toHaveBeenCalledWith({
      projectId,
    });
    expect(persistenceService.retrieveMigrationRiskAssessmentsForProject).toHaveBeenCalledWith({
      projectId,
    });
  });
});
