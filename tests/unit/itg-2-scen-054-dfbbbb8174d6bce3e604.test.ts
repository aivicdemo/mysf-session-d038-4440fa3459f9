import { generateMappingTable } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-generation-service';
import * as validationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';
import type { GenerateMappingTableOutput, RealizabilityAssessment } from '../../src/logic/mapping-generation-service';

describe('SCEN-054: 出力検証：realizabilityAssessmentには実現可能性スコア・リスク評価・推奨事項が含まれている', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('realizabilityAssessment が実現可能性スコア・リスク評価・推奨事項を含む', async () => {
    const mockVerifyUserAuthenticationAndAuthorization = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'generateMappingTable',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const mockResolveProjectContext = jest.fn().mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      userRole: 'analyst',
      isContextValid: true,
    });


    const mockValidateSalesforceObjectDefinitions = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 2, successCount: 2, errorCount: 0, totalErrorsDetected: 0 },
    });

    const mockValidateCalculationLogicDefinitions = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 2, successCount: 2, errorCount: 0, totalErrorsDetected: 0 },
    });

    const mockValidateObjectReferenceRelationships = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 2, successCount: 2, errorCount: 0, totalErrorsDetected: 0 },
    });

    const mockValidateStandardFunctionMappings = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 4, successCount: 4, errorCount: 0, totalErrorsDetected: 0 },
    });

    const mockSaveMappingDetails = jest.fn().mockResolvedValue({
      mappingDetailId: 'mapping-001',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      existingFunctionName: 'Invoice Fields',
      mappingMethod: 'Direct',
      mappingTargetObjectId: 'cap-001',
      migrationStatus: 'Planned',
      verificationStatus: 'Pending',
      createdAt: new Date().toISOString(),
      createdBy: '770e8400-e29b-41d4-a716-446655440002',
      updatedAt: new Date().toISOString(),
      updatedBy: '770e8400-e29b-41d4-a716-446655440002',
    });

    const mockRecordMappingGenerationAuditTrail = jest.fn().mockResolvedValue({
      auditTrailId: 'audit-001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'generateMappingTable',
      targetTableName: 'MappingTable',
      operationStatus: 'Success',
      operationTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    jest.spyOn(authModule, 'verifyUserAuthenticationAndAuthorization').mockImplementation(mockVerifyUserAuthenticationAndAuthorization);
    jest.spyOn(contextModule, 'resolveProjectContext').mockImplementation(mockResolveProjectContext);
    jest.spyOn(validationModule, 'validateSalesforceObjectDefinitions').mockImplementation(mockValidateSalesforceObjectDefinitions);
    jest.spyOn(validationModule, 'validateCalculationLogicDefinitions').mockImplementation(mockValidateCalculationLogicDefinitions);
    jest.spyOn(validationModule, 'validateObjectReferenceRelationships').mockImplementation(mockValidateObjectReferenceRelationships);
    jest.spyOn(validationModule, 'validateStandardFunctionMappings').mockImplementation(mockValidateStandardFunctionMappings);
    jest.spyOn(persistenceModule, 'saveMappingDetails').mockImplementation(mockSaveMappingDetails);
    jest.spyOn(auditModule, 'recordMappingGenerationAuditTrail').mockImplementation(mockRecordMappingGenerationAuditTrail);

    const result = await generateMappingTable({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      executionTimestamp: 1700000000000,
    }) as GenerateMappingTableOutput;

    const assessment = result.realizabilityAssessment as RealizabilityAssessment;
    expect(assessment).toBeDefined();
    expect(typeof assessment.realizabilityScore).toBe('number');
    expect(assessment.realizabilityScore).toBeGreaterThanOrEqual(0);
    expect(assessment.realizabilityScore).toBeLessThanOrEqual(100);
    expect(assessment.riskLevel).toBeDefined();
    expect(['Low', 'Medium', 'High', 'Critical']).toContain(assessment.riskLevel);
    expect(Array.isArray(assessment.criticalGaps)).toBe(true);
    expect(Array.isArray(assessment.recommendations)).toBe(true);
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });
});
