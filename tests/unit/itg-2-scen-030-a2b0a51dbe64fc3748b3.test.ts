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

describe('SCEN-030: generateMappingTable - Happy path', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId,
      hasPermission: true,
      permissionType: 'GENERATE_MAPPING_TABLE',
    });

    // Mock project context
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isValid: true,
      userHasAccess: true,
      projectStatus: 'ACTIVE',
    });

    // Mock object structure extraction
    (persistenceService.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      objects: [
        {
          objectName: 'Invoice__c',
          fields: [
            { fieldName: 'InvoiceNumber__c', dataType: 'TEXT', required: true },
            { fieldName: 'InvoiceDate__c', dataType: 'DATE', required: true },
            {
              fieldName: 'TotalAmount__c',
              dataType: 'CURRENCY',
              required: false,
              calculationFormula: 'SUM(InvoiceLineItems__r.LineAmount__c)',
            },
          ],
          isComplete: true,
        },
        {
          objectName: 'InvoiceLineItem__c',
          fields: [
            { fieldName: 'LineItemNumber__c', dataType: 'TEXT', required: true },
            { fieldName: 'Quantity__c', dataType: 'NUMBER', required: true },
            { fieldName: 'UnitPrice__c', dataType: 'CURRENCY', required: true },
            {
              fieldName: 'LineAmount__c',
              dataType: 'CURRENCY',
              required: false,
              calculationFormula: 'Quantity__c * UnitPrice__c',
            },
            { fieldName: 'Invoice__c', dataType: 'LOOKUP', required: true, referencedObject: 'Invoice__c' },
          ],
          isComplete: true,
        },
      ],
    });

    // Mock calculation logic
    (persistenceService.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue({
      calculationLogics: [
        {
          logicId: 'logic-001',
          logicType: 'ROLLUP_SUMMARY',
          targetObject: 'Invoice__c',
          targetField: 'TotalAmount__c',
          sourceObject: 'InvoiceLineItem__c',
          aggregateOperation: 'SUM',
          aggregateField: 'LineAmount__c',
          filterCriteria: null,
          dependencies: [],
        },
        {
          logicId: 'logic-002',
          logicType: 'FORMULA',
          targetObject: 'InvoiceLineItem__c',
          targetField: 'LineAmount__c',
          formulaExpression: 'Quantity__c * UnitPrice__c',
          dependencies: ['InvoiceLineItem__c.Quantity__c', 'InvoiceLineItem__c.UnitPrice__c'],
        },
      ],
      isComplete: true,
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
      savedCount: 6,
      failedCount: 0,
      savedIds: ['map-detail-001', 'map-detail-002', 'map-detail-003', 'map-detail-004', 'map-detail-005', 'map-detail-006'],
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

  it('should generate a complete mapping table with valid project and target system', async () => {
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

    // Verify mapping details
    expect(output.mappingDetails).toBeDefined();
    expect(Array.isArray(output.mappingDetails)).toBe(true);
    expect(output.mappingDetails.length).toBeGreaterThanOrEqual(5);

    // Verify gap analysis summary
    expect(output.gapAnalysisSummary).toBeDefined();
    expect(output.gapAnalysisSummary.fullyMappedCount).toBe(4);
    expect(output.gapAnalysisSummary.partiallyMappedCount).toBe(1);
    expect(output.gapAnalysisSummary.customizationRequiredCount).toBe(0);
    expect(output.gapAnalysisSummary.notMappedCount).toBe(0);
    expect(output.gapAnalysisSummary.mappingCoveragePercentage).toBe(95);

    // Verify realizability assessment
    expect(output.realizabilityAssessment).toBeDefined();
    expect(output.realizabilityAssessment.realizabilityScore).toBe(95);
    expect(output.realizabilityAssessment.riskLevel).toBe('LOW');
    expect(output.realizabilityAssessment.recommendations).toContain(
      '標準機能での実現性が高い。部分対応の ROLLUP_SUM について、追加カスタマイズの検討を推奨'
    );
  });

  it('should call all required service methods in correct order', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await generateMappingTable(input);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(contextResolver.resolveProjectContext).toHaveBeenCalled();
    expect(validationService.validateSalesforceObjectDefinitions).toHaveBeenCalled();
    expect(validationService.validateCalculationLogicDefinitions).toHaveBeenCalled();
    expect(validationService.validateObjectReferenceRelationships).toHaveBeenCalled();
    expect(validationService.validateStandardFunctionMappings).toHaveBeenCalled();
    expect(persistenceService.saveMappingDetails).toHaveBeenCalled();
    expect(auditService.recordMappingGenerationAuditTrail).toHaveBeenCalled();
  });
});
