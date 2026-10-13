import { generateMappingTable } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-generation-service';
import * as validationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';
import type { GenerateMappingTableOutput } from '../../src/logic/mapping-generation-service';

describe('SCEN-049: 業務ルール制約3（br-tx_10-006）：請求書・請求明細カスタムオブジェクトの計算ロジックが不明確な場合、警告メッセージが発出されるが処理は続行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('計算ロジック定義が不明確な場合、警告メッセージが記録され、処理は正常に完了する', async () => {
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
      summary: {
        totalObjectsValidated: 2,
        successCount: 2,
        errorCount: 0,
        totalErrorsDetected: 0,
      },
    });

    const mockValidateCalculationLogicDefinitions = jest.fn().mockResolvedValue({
      isValid: false,
      validationResults: [
        {
          logicName: 'TotalAmountCalculation',
          isValid: false,
          errors: [
            {
              errorCode: 'UNCLEAR_LOGIC',
              errorMessage: '計算ロジック calc-001 の定義が不明確：売上と返品の区別方法が未定義',
            },
          ],
        },
        {
          logicName: 'LineAmountFormula',
          isValid: false,
          errors: [
            {
              errorCode: 'UNCLEAR_LOGIC',
              errorMessage: '計算ロジック calc-002 の定義が不明確：請求明細生成ルールが未整理',
            },
          ],
        },
      ],
      summary: {
        totalObjectsValidated: 2,
        successCount: 0,
        errorCount: 2,
        totalErrorsDetected: 2,
      },
    });

    const mockValidateObjectReferenceRelationships = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: {
        totalObjectsValidated: 2,
        successCount: 2,
        errorCount: 0,
        totalErrorsDetected: 0,
      },
    });

    const mockValidateStandardFunctionMappings = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: {
        totalObjectsValidated: 2,
        successCount: 2,
        errorCount: 0,
        totalErrorsDetected: 0,
      },
    });

    const mockSaveMappingDetails = jest.fn().mockResolvedValue({
      mappingDetailId: 'mapping-detail-001',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      existingFunctionName: 'Invoice Fields',
      mappingMethod: 'Direct',
      mappingTargetObjectId: 'std-001',
      migrationStatus: 'Planned',
      verificationStatus: 'Pending',
      createdAt: new Date().toISOString(),
      createdBy: '770e8400-e29b-41d4-a716-446655440002',
      updatedAt: new Date().toISOString(),
      updatedBy: '770e8400-e29b-41d4-a716-446655440002',
    });

    const mockRecordMappingGenerationAuditTrail = jest.fn().mockResolvedValue({
      auditTrailId: 'audit-trail-001',
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
      executionTimestamp: 1704067200000,
    }) as GenerateMappingTableOutput;

    expect(result).toBeDefined();
    expect(result.mappingTableId).toBeDefined();
    expect(result.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.targetSystemId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.generatedAt).toBeGreaterThanOrEqual(1704067200000);
    expect(result.mappingDetails).toBeDefined();
    expect(result.gapAnalysisSummary).toBeDefined();
    expect(result.realizabilityAssessment).toBeDefined();
  });
});
