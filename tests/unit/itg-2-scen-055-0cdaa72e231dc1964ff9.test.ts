import { generateMappingTable, type GenerateMappingTableOutput, type MappingDetail } from '../../src/logic/mapping-generation-service';
import * as authMod from '../../src/logic/authentication-authorization';
import * as projMod from '../../src/logic/project-context-resolver';
import * as persistMod from '../../src/logic/mapping-persistence';
import * as auditMod from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));
jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  saveMappingDetails: jest.fn(),
}));
jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingGenerationAuditTrail: jest.fn(),
}));

describe('SCEN-055: mappingDetails配列の各要素には既存機能・マッピング方式・実装方針・ギャップ分類が記録されている', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(authMod.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      isAuthorized: true,
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'mapping-generation',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });

    jest.mocked(projMod.resolveProjectContext).mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      isValid: true,
      userHasAccess: true,
    });

    jest.mocked(persistMod.saveMappingDetails).mockResolvedValue({
      mappingDetailId: 'map-detail-001',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      existingFunctionName: 'Invoice_Amount__c',
      mappingTargetObjectId: 'target-001',
      mappingMethod: 'complete',
      migrationStatus: 'pending',
      verificationStatus: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: '770e8400-e29b-41d4-a716-446655440002',
      updatedAt: new Date().toISOString(),
      updatedBy: '770e8400-e29b-41d4-a716-446655440002',
    });

    jest.mocked(auditMod.recordMappingGenerationAuditTrail).mockResolvedValue({
      auditTrailId: 'audit-001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'mapping-generation',
      targetTableName: 'MappingDetails',
      operationStatus: 'success',
      operationTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  });

  test('generateMappingTable returns mappingDetails with all required fields', async () => {
    const input = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      executionTimestamp: 1704067200000,
    };

    const result = await generateMappingTable(input);

    expect(result.mappingTableId).toBeDefined();
    expect(typeof result.mappingTableId).toBe('string');
    expect(result.mappingTableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    expect(result.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.targetSystemId).toBe('660e8400-e29b-41d4-a716-446655440001');

    expect(Array.isArray(result.mappingDetails)).toBe(true);
    expect(result.mappingDetails.length).toBe(6);

    result.mappingDetails.forEach((detail) => {
      expect(detail).toHaveProperty('mappingDetailId');
      expect(detail).toHaveProperty('existingFeatureName');
      expect(detail).toHaveProperty('existingFeatureDescription');
      expect(detail).toHaveProperty('mappingMethod');
      expect(detail).toHaveProperty('implementationApproach');
      expect(detail).toHaveProperty('gapClassification');
      expect(detail).toHaveProperty('gapScore');
      expect(detail).toHaveProperty('complexity');
      expect(detail).toHaveProperty('dependencies');
      expect(detail).toHaveProperty('verificationMethod');
    });

    const partialMappingDetail = result.mappingDetails.find((d) => d.existingFeatureName === 'Invoice_Line_Item__c.Amount__c');
    if (partialMappingDetail) {
      expect(partialMappingDetail.gapClassification).toContain('部分対応');
      expect(partialMappingDetail.implementationApproach).toContain('手動入力');
    }

    expect(result.gapAnalysisSummary).toBeDefined();
    expect(result.gapAnalysisSummary.totalMappingCount).toBe(6);
    expect(result.gapAnalysisSummary.fullyMappedCount).toBe(5);
    expect(result.gapAnalysisSummary.partiallyMappedCount).toBe(1);

    expect(result.realizabilityAssessment).toBeDefined();
    expect(result.realizabilityAssessment.realizabilityScore).toBeGreaterThan(0);
    expect(result.realizabilityAssessment.realizabilityScore).toBeLessThanOrEqual(100);
    expect(result.realizabilityAssessment.riskLevel).toBeDefined();
    expect(result.realizabilityAssessment.estimatedEffort).toBeDefined();

    expect(result.generatedAt).toBe(1704067200000);
  });
});
