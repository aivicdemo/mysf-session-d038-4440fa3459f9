import { generateMappingTable } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-generation-service';
import * as validationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';
import type { GenerateMappingTableOutput, GapAnalysisSummary } from '../../src/logic/mapping-generation-service';

describe('SCEN-053: 出力検証：gapAnalysisSummaryには完全対応・部分対応・カスタマイズ必要・非対応の件数とスコアが集計されている', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gapAnalysisSummary が正しい集計値を含む', async () => {
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
      summary: { totalObjectsValidated: 1, successCount: 1, errorCount: 0, totalErrorsDetected: 0 },
    });

    const mockValidateStandardFunctionMappings = jest.fn().mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 5, successCount: 5, errorCount: 0, totalErrorsDetected: 0 },
    });

    jest.spyOn(authModule, 'verifyUserAuthenticationAndAuthorization').mockImplementation(mockVerifyUserAuthenticationAndAuthorization);
    jest.spyOn(contextModule, 'resolveProjectContext').mockImplementation(mockResolveProjectContext);
    jest.spyOn(validationModule, 'validateSalesforceObjectDefinitions').mockImplementation(mockValidateSalesforceObjectDefinitions);
    jest.spyOn(validationModule, 'validateCalculationLogicDefinitions').mockImplementation(mockValidateCalculationLogicDefinitions);
    jest.spyOn(validationModule, 'validateObjectReferenceRelationships').mockImplementation(mockValidateObjectReferenceRelationships);
    jest.spyOn(validationModule, 'validateStandardFunctionMappings').mockImplementation(mockValidateStandardFunctionMappings);

    const result = await generateMappingTable({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      executionTimestamp: 1700000000000,
    }) as GenerateMappingTableOutput;

    const summary = result.gapAnalysisSummary as GapAnalysisSummary;
    expect(summary).toBeDefined();
    expect(typeof summary.fullyMappedCount).toBe('number');
    expect(typeof summary.partiallyMappedCount).toBe('number');
    expect(typeof summary.customizationRequiredCount).toBe('number');
    expect(typeof summary.notMappedCount).toBe('number');
    expect(summary.fullyMappedCount).toBe(4);
    expect(summary.partiallyMappedCount).toBe(1);
    expect(summary.customizationRequiredCount).toBe(0);
    expect(summary.notMappedCount).toBe(0);
  });
});
