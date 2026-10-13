import { generateMappingTable, GenerateMappingTableOutput, MappingDetail } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';
import * as auditService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-046: Generate mapping table with complete Salesforce objects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate mapping table and realizability assessment successfully', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const executionTimestamp = 1704067200000;

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
      userId: '770e8400-e29b-41d4-a716-446655440002',
      roles: ['migration_operator'],
    });

    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      isValid: true,
      userHasAccess: true,
      projectStatus: 'active',
    });

    (persistenceService.saveMappingDetails as jest.Mock).mockResolvedValue({
      saved: true,
      recordCount: 13,
    });

    (auditService.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditRecorded: true,
    });

    const result = await generateMappingTable({
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.mappingTableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.mappingDetails).toBeDefined();
    expect(Array.isArray(result.mappingDetails)).toBe(true);
    expect(result.mappingDetails.length).toBeGreaterThanOrEqual(13);

    expect(result.gapAnalysisSummary).toBeDefined();
    expect(result.gapAnalysisSummary.totalMappingCount).toBeGreaterThanOrEqual(13);
    expect(result.gapAnalysisSummary.fullyMappedCount).toBe(13);
    expect(result.gapAnalysisSummary.partiallyMappedCount).toBe(0);
    expect(result.gapAnalysisSummary.customizationRequiredCount).toBe(0);
    expect(result.gapAnalysisSummary.notMappedCount).toBe(0);
    expect(result.gapAnalysisSummary.mappingCoveragePercentage).toBe(100);

    expect(result.realizabilityAssessment).toBeDefined();
    expect(result.realizabilityAssessment.realizabilityScore).toBe(100);
    expect(result.realizabilityAssessment.riskLevel).toBe('LOW');
    expect(result.realizabilityAssessment.recommendations.length).toBeGreaterThan(0);
    expect(result.realizabilityAssessment.recommendations).toContain(
      '移行対象システムの標準機能でSalesforce請求書・請求明細機能をカスタマイズなしで完全実現可能'
    );

    expect(result.generatedAt).toBeGreaterThanOrEqual(executionTimestamp);
    expect(persistenceService.saveMappingDetails).toHaveBeenCalled();
    expect(auditService.recordMappingGenerationAuditTrail).toHaveBeenCalled();
  });
});
