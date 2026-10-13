import { searchMappingsByCondition } from '../../src/logic/mapping-query-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextService from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-258: ページングで要求したページ番号が全ページ数を超えた場合、該当ページのマッピングが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ページ番号が全ページ数を超えた場合、空配列を返す', async () => {
    const userId = 'user-001';
    const projectId = 'proj-salesforce-migration-2026';
    const targetSystemId = 'target-oracle-erp-001';
    const pageNumber = 5;
    const pageSize = 20;

    // Mock authentication
    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'SEARCH_MAPPING',
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

    // Generate 75 sample mapping detail records
    const mappingDetails = Array.from({ length: 75 }, (_, i) => ({
      mappingDetailId: `map-${String(i + 1).padStart(3, '0')}`,
      projectId,
      targetSystemId,
      existingFunctionName: `Function-${i + 1}`,
      mappingTargetObjectId: `target-${i + 1}`,
      mappingMethod: 'DIRECT_MAPPING',
      migrationStatus: 'FULLY_MAPPED',
      priority: 1,
      complexity: 'SIMPLE',
      verificationStatus: 'VERIFIED',
      createdAt: '2026-10-01T00:00:00Z',
      createdBy: userId,
      updatedAt: '2026-10-01T00:00:00Z',
      updatedBy: userId,
    }));

    // Generate 75 sample validation result records
    const validationResults = Array.from({ length: 75 }, (_, i) => ({
      validationResultId: `val-${String(i + 1).padStart(3, '0')}`,
      projectId,
      mappingDetailId: `map-${String(i + 1).padStart(3, '0')}`,
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
    }));

    // Generate 75 sample risk assessment records
    const riskAssessments = Array.from({ length: 75 }, (_, i) => ({
      riskAssessmentId: `risk-${String(i + 1).padStart(3, '0')}`,
      projectId,
      riskClassification: 'MAPPING_RISK',
      riskItemName: `Risk-${i + 1}`,
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
    }));

    (persistenceService.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mappingDetails);
    (persistenceService.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue(validationResults);
    (persistenceService.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue(riskAssessments);

    const result = await searchMappingsByCondition({
      userId,
      projectId,
      targetSystemId,
      pageNumber,
      pageSize,
    });

    // Verify the result
    expect(result.mappingTableRows).toEqual([]);
    expect(result.totalRowCount).toBe(75);
    expect(result.pageNumber).toBe(5);
    expect(result.pageSize).toBe(20);
    expect(result.filteredRowCount).toBe(0);

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
