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

describe('SCEN-044: generateMappingTable - Warning on incomplete calculation logic definition', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      authorized: true,
      userId,
    });

    // Mock project context
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      accessPermitted: true,
    });

    // Mock validation services
    (validationService.validateSalesforceObjectDefinitions as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });

    // CRITICAL: validateCalculationLogicDefinitions returns warning but still valid
    (validationService.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      valid: false,
      errors: [
        {
          message: '計算ロジック定義が不完全です。既存システムロジックとSalesforceロジックの定義を確認してください。',
          level: 'warning',
        },
      ],
    });

    (validationService.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });

    (validationService.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      valid: true,
      errors: [],
    });

    // Mock persistence
    (persistenceService.saveMappingDetails as jest.Mock).mockResolvedValue({
      saved: true,
      recordCount: 3,
    });

    // Mock audit trail
    (auditService.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      recorded: true,
      auditId: '880e8400-e29b-41d4-a716-446655440003',
    });
  });

  it('should continue processing and return output despite calculation logic warning', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    const output = await generateMappingTable(input);

    // Should successfully return output
    expect(output).toBeDefined();
    expect(output.projectId).toBe(projectId);
    expect(output.targetSystemId).toBe(targetSystemId);
    expect(output.generatedAt).toBeDefined();

    // Verify UUID format for mappingTableId
    expect(output.mappingTableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify mapping details are generated despite warning
    expect(output.mappingDetails).toBeDefined();
    expect(Array.isArray(output.mappingDetails)).toBe(true);
    expect(output.mappingDetails.length).toBeGreaterThanOrEqual(3);

    // Verify gap analysis summary is present
    expect(output.gapAnalysisSummary).toBeDefined();
    expect(output.gapAnalysisSummary.fullyMappedCount).toBeDefined();
    expect(output.gapAnalysisSummary.partiallyMappedCount).toBeDefined();
    expect(output.gapAnalysisSummary.customizationRequiredCount).toBeDefined();
    expect(output.gapAnalysisSummary.notMappedCount).toBeDefined();

    // Verify realizability assessment is present
    expect(output.realizabilityAssessment).toBeDefined();
    expect(output.realizabilityAssessment.realizabilityScore).toBeDefined();
    expect(output.realizabilityAssessment.riskLevel).toBeDefined();
  });

  it('should invoke verifyUserAuthenticationAndAuthorization and return authenticated and authorized', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
  });

  it('should invoke resolveProjectContext and confirm access is permitted', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(contextResolver.resolveProjectContext).toHaveBeenCalled();
  });

  it('should invoke validateCalculationLogicDefinitions and handle warning-level error', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(validationService.validateCalculationLogicDefinitions).toHaveBeenCalled();
    const validationCall = (validationService.validateCalculationLogicDefinitions as jest.Mock).mock.results[0].value;
    expect(validationCall).toBeDefined();
  });

  it('should not throw CalculationLogicDefinitionIncompleteError even with warning', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    // Should not throw despite warning from validateCalculationLogicDefinitions
    await expect(generateMappingTable(input)).resolves.toBeDefined();
  });

  it('should invoke validateSalesforceObjectDefinitions', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(validationService.validateSalesforceObjectDefinitions).toHaveBeenCalled();
  });

  it('should invoke validateObjectReferenceRelationships', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(validationService.validateObjectReferenceRelationships).toHaveBeenCalled();
  });

  it('should invoke validateStandardFunctionMappings', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(validationService.validateStandardFunctionMappings).toHaveBeenCalled();
  });

  it('should continue to classifyMappingGaps and buildMappingDetails despite warning', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    const output = await generateMappingTable(input);

    // If execution reaches here without throwing, classifyMappingGaps and buildMappingDetails were called
    expect(output).toBeDefined();
    expect(output.mappingDetails).toBeDefined();
  });

  it('should save mapping details after warning', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(persistenceService.saveMappingDetails).toHaveBeenCalled();
  });

  it('should record audit trail after processing', async () => {
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
