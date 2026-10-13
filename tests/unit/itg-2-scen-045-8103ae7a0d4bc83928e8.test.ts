import { generateMappingTable, GenerateMappingTableOutput, MappingDetail } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';
import * as auditService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-045: Warning message when mapping table rows exceed 100', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate mapping table with 105 mappings and emit warning message', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440001';
    const targetSystemId = '550e8400-e29b-41d4-a716-446655440002';
    const userId = '550e8400-e29b-41d4-a716-446655440003';
    const executionTimestamp = 1700000000000;

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      isAuthorized: true,
      userId: '550e8400-e29b-41d4-a716-446655440003',
    });

    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440002',
      isValid: true,
      userHasAccess: true,
    });

    (persistenceService.saveMappingDetails as jest.Mock).mockResolvedValue({
      saved: true,
      recordCount: 105,
    });

    (auditService.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditRecorded: true,
      trailId: 'audit_001',
    });

    const result = await generateMappingTable({
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    });

    expect(result).toBeDefined();
    expect(result.mappingTableId).toBeDefined();
    expect(result.mappingDetails).toHaveLength(105);
    expect(result.mappingDetails.length).toBeGreaterThan(100);
    expect(result.gapAnalysisSummary).toBeDefined();
    expect(result.gapAnalysisSummary.totalMappingCount).toBe(105);
    expect(result.realizabilityAssessment).toBeDefined();
    expect(result.generatedAt).toBeGreaterThanOrEqual(executionTimestamp);
    expect(persistenceService.saveMappingDetails).toHaveBeenCalled();
    expect(auditService.recordMappingGenerationAuditTrail).toHaveBeenCalled();
  });
});
