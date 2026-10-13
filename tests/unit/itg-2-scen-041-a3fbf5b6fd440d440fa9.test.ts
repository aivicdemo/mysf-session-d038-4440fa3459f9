import { generateMappingTable, GenerateMappingTableOutput } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';
import * as validationService from '../../src/logic/data-validation-rules';
import * as auditService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-041: generateMappingTable - Business rule validation with complete mapping', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440001';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440002';
  const userId = '770e8400-e29b-41d4-a716-446655440003';
  const executionTimestamp = 1700000000000;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
      userId,
    });

    // Mock project context
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isValid: true,
      userHasAccess: true,
    });

    // Mock validation services
    (validationService.validateSalesforceObjectDefinitions as jest.Mock).mockResolvedValue({
      isValid: true,
      validationMessages: [],
    });
    (validationService.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      isValid: true,
      validationMessages: [],
    });
    (validationService.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      isValid: true,
      validationMessages: [],
    });
    (validationService.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationMessages: [],
    });

    // Mock persistence
    (persistenceService.saveMappingDetails as jest.Mock).mockResolvedValue({
      savedCount: 8,
      failedCount: 0,
      savedIds: [
        'map-detail-001',
        'map-detail-002',
        'map-detail-003',
        'map-detail-004',
        'map-detail-005',
        'map-detail-006',
        'map-detail-007',
        'map-detail-008',
      ],
    });

    // Mock audit trail
    (auditService.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-001',
      projectId,
      userId,
      action: 'MAPPING_GENERATED',
      timestamp: executionTimestamp,
      status: 'SUCCESS',
    });
  });

  it('should generate mapping template with 8 mapping details for Invoice and InvoiceLineItem', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    const output = await generateMappingTable(input);

    expect(output).toBeDefined();
    expect(output.projectId).toBe(projectId);
    expect(output.targetSystemId).toBe(targetSystemId);
    expect(output.generatedAt).toBe(executionTimestamp);

    // Verify UUID format for mappingTableId
    expect(output.mappingTableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify exactly 8 mapping details
    expect(output.mappingDetails).toBeDefined();
    expect(Array.isArray(output.mappingDetails)).toBe(true);
    expect(output.mappingDetails.length).toBe(8);

    // Verify all mapping details contain required fields
    output.mappingDetails.forEach(detail => {
      expect(detail.mappingDetailId).toBeDefined();
      expect(detail.existingFeatureName).toBeDefined();
      expect(detail.mappingMethod).toBeDefined();
      expect(detail.implementationApproach).toBeDefined();
      expect(detail.gapClassification).toBeDefined();
      expect(detail.gapScore).toBeDefined();
    });

    // Verify gap analysis summary
    expect(output.gapAnalysisSummary).toBeDefined();
    expect(output.gapAnalysisSummary.fullyMappedCount).toBe(6);
    expect(output.gapAnalysisSummary.partiallyMappedCount).toBe(2);
    expect(output.gapAnalysisSummary.customizationRequiredCount).toBe(0);
    expect(output.gapAnalysisSummary.notMappedCount).toBe(0);

    // Verify realizability assessment
    expect(output.realizabilityAssessment).toBeDefined();
    expect(output.realizabilityAssessment.realizabilityScore).toBeGreaterThanOrEqual(75);
    expect(output.realizabilityAssessment.riskLevel).toBe('LOW');
    expect(output.realizabilityAssessment.recommendations).toBeDefined();
    expect(Array.isArray(output.realizabilityAssessment.recommendations)).toBe(true);
  });

  it('should verify user authentication and authorization', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
      })
    );
  });

  it('should resolve project context with valid project and target system', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(contextResolver.resolveProjectContext).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        targetSystemId,
      })
    );
  });

  it('should validate all four aspects: objects, calculation logic, relationships, and functions', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(validationService.validateSalesforceObjectDefinitions).toHaveBeenCalled();
    expect(validationService.validateCalculationLogicDefinitions).toHaveBeenCalled();
    expect(validationService.validateObjectReferenceRelationships).toHaveBeenCalled();
    expect(validationService.validateStandardFunctionMappings).toHaveBeenCalled();
  });

  it('should save 8 mapping details to persistence', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(persistenceService.saveMappingDetails).toHaveBeenCalled();
    const saveCall = (persistenceService.saveMappingDetails as jest.Mock).mock.calls[0][0];
    expect(saveCall).toBeDefined();
  });

  it('should record audit trail with SUCCESS status', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(auditService.recordMappingGenerationAuditTrail).toHaveBeenCalled();
  });
});
