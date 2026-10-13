import { generateMappingTable } from '../../src/logic/mapping-generation-service';
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

describe('SCEN-057: 操作の監査証跡が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock verifyUserAuthenticationAndAuthorization
    jest.mocked(authMod.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      isAuthorized: true,
      userId: '770e8400-e29b-41d4-a716-446655440222',
      operationType: 'mapping-generation',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });

    // Mock resolveProjectContext
    jest.mocked(projMod.resolveProjectContext).mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440111',
      isValid: true,
      userHasAccess: true,
    });

    // Mock saveMappingDetails
    jest.mocked(persistMod.saveMappingDetails).mockResolvedValue({
      mappingDetailId: 'map-detail-001',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440111',
      existingFunctionName: 'TestFeature',
      mappingTargetObjectId: 'target-001',
      mappingMethod: 'complete',
      migrationStatus: 'pending',
      verificationStatus: 'pending',
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      createdBy: '770e8400-e29b-41d4-a716-446655440222',
      updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      updatedBy: '770e8400-e29b-41d4-a716-446655440222',
    });

    // Mock recordMappingGenerationAuditTrail
    jest.mocked(auditMod.recordMappingGenerationAuditTrail).mockResolvedValue({
      auditTrailId: 'audit-trail-001',
      userId: '770e8400-e29b-41d4-a716-446655440222',
      operationType: 'mapping-generation',
      targetTableName: 'MappingDetails',
      operationStatus: 'success',
      operationTimestamp: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    });
  });

  test('recordMappingGenerationAuditTrail is called with correct parameters', async () => {
    const input = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440111',
      userId: '770e8400-e29b-41d4-a716-446655440222',
      executionTimestamp: 1704067200000,
    };

    const result = await generateMappingTable(input);

    // Verify recordMappingGenerationAuditTrail was called exactly once
    expect(jest.mocked(auditMod.recordMappingGenerationAuditTrail)).toHaveBeenCalledTimes(1);

    // Verify the audit trail call includes required parameters
    const auditCall = jest.mocked(auditMod.recordMappingGenerationAuditTrail).mock.calls[0][0];
    expect(auditCall.userId).toBe('770e8400-e29b-41d4-a716-446655440222');
    expect(auditCall.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(auditCall.targetSystemId).toBe('660e8400-e29b-41d4-a716-446655440111');
    expect(auditCall.targetObjectId).toBeDefined();
    expect(auditCall.mappingResult).toBeDefined();
    expect(auditCall.executionResultStatus).toBeDefined();
    expect(auditCall.ipAddress).toBeDefined();
    expect(auditCall.sessionId).toBeDefined();
    expect(auditCall.operationExecutedAt).toBeDefined();
  });

  test('generateMappingTable returns output with correct audit trail information', async () => {
    const input = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440111',
      userId: '770e8400-e29b-41d4-a716-446655440222',
      executionTimestamp: 1704067200000,
    };

    const result = await generateMappingTable(input);

    // Verify result contains mapping table information
    expect(result.mappingTableId).toBeDefined();
    expect(typeof result.mappingTableId).toBe('string');
    expect(result.mappingTableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify result field values match input
    expect(result.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.targetSystemId).toBe('660e8400-e29b-41d4-a716-446655440111');

    // Verify mappingDetails array
    expect(Array.isArray(result.mappingDetails)).toBe(true);
    expect(result.mappingDetails.length).toBeGreaterThan(0);

    // Verify mappingDetails have required structure
    result.mappingDetails.forEach((detail) => {
      expect(detail.mappingDetailId).toBeDefined();
      expect(detail.existingFeatureName).toBeDefined();
      expect(detail.mappingMethod).toBeDefined();
      expect(detail.implementationApproach).toBeDefined();
      expect(detail.gapClassification).toBeDefined();
    });

    // Verify gapAnalysisSummary
    expect(result.gapAnalysisSummary).toEqual(
      expect.objectContaining({
        totalMappingCount: expect.any(Number),
        fullyMappedCount: expect.any(Number),
        partiallyMappedCount: expect.any(Number),
        customizationRequiredCount: expect.any(Number),
        notMappedCount: expect.any(Number),
        averageGapScore: expect.any(Number),
        mappingCoveragePercentage: expect.any(Number),
      })
    );

    // Verify realizabilityAssessment
    expect(result.realizabilityAssessment).toEqual(
      expect.objectContaining({
        realizabilityScore: expect.any(Number),
        riskLevel: expect.any(String),
        estimatedEffort: expect.any(String),
        criticalGaps: expect.any(Array),
        recommendations: expect.any(Array),
      })
    );

    // Verify generatedAt
    expect(typeof result.generatedAt).toBe('number');
    expect(result.generatedAt).toBe(1704067200000);
  });
});
