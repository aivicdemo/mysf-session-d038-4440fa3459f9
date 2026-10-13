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

describe('SCEN-056: マッピング詳細が永続化層に正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock verifyUserAuthenticationAndAuthorization
    jest.mocked(authMod.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      isAuthorized: true,
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'mapping-generation',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });

    // Mock resolveProjectContext
    jest.mocked(projMod.resolveProjectContext).mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      isValid: true,
      userHasAccess: true,
    });

    // Mock saveMappingDetails to return 3 records
    jest.mocked(persistMod.saveMappingDetails)
      .mockResolvedValueOnce({
        mappingDetailId: '880e8400-e29b-41d4-a716-446655440003',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
        existingFunctionName: 'InvoiceNumber__c',
        mappingTargetObjectId: 'target-001',
        mappingMethod: 'Complete',
        migrationStatus: 'pending',
        verificationStatus: 'pending',
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        createdBy: '770e8400-e29b-41d4-a716-446655440002',
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedBy: '770e8400-e29b-41d4-a716-446655440002',
      })
      .mockResolvedValueOnce({
        mappingDetailId: '880e8400-e29b-41d4-a716-446655440004',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
        existingFunctionName: 'InvoiceAmount__c',
        mappingTargetObjectId: 'target-002',
        mappingMethod: 'Complete',
        migrationStatus: 'pending',
        verificationStatus: 'pending',
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        createdBy: '770e8400-e29b-41d4-a716-446655440002',
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedBy: '770e8400-e29b-41d4-a716-446655440002',
      })
      .mockResolvedValueOnce({
        mappingDetailId: '880e8400-e29b-41d4-a716-446655440005',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
        existingFunctionName: 'Customer__c',
        mappingTargetObjectId: 'target-003',
        mappingMethod: 'Partial',
        migrationStatus: 'pending',
        verificationStatus: 'pending',
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        createdBy: '770e8400-e29b-41d4-a716-446655440002',
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedBy: '770e8400-e29b-41d4-a716-446655440002',
      });

    // Mock recordMappingGenerationAuditTrail
    jest.mocked(auditMod.recordMappingGenerationAuditTrail).mockResolvedValue({
      auditTrailId: '990e8400-e29b-41d4-a716-446655440004',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'mapping-generation',
      targetTableName: 'MappingDetails',
      operationStatus: 'success',
      operationTimestamp: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    });
  });

  test('saveMappingDetails is called 3 times and all records are saved successfully', async () => {
    const input = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      executionTimestamp: 1704067200000,
    };

    const result = await generateMappingTable(input);

    // Verify saveMappingDetails was called 3 times
    expect(jest.mocked(persistMod.saveMappingDetails)).toHaveBeenCalledTimes(3);

    // Verify mappingDetails contains 3 records
    expect(result.mappingDetails).toHaveLength(3);

    // Verify result fields match expected values
    expect(result.projectId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.targetSystemId).toBe('660e8400-e29b-41d4-a716-446655440001');

    // Verify mappingTableId is UUID format
    expect(result.mappingTableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify each mapping detail has been created with proper IDs
    const mappingIds = result.mappingDetails.map((d) => d.mappingDetailId);
    expect(mappingIds).toContain('880e8400-e29b-41d4-a716-446655440003');
    expect(mappingIds).toContain('880e8400-e29b-41d4-a716-446655440004');
    expect(mappingIds).toContain('880e8400-e29b-41d4-a716-446655440005');

    // Verify gapAnalysisSummary shows correct classification counts
    expect(result.gapAnalysisSummary.fullyMappedCount).toBe(2);
    expect(result.gapAnalysisSummary.partiallyMappedCount).toBe(1);
    expect(result.gapAnalysisSummary.customizationRequiredCount).toBe(0);
    expect(result.gapAnalysisSummary.notMappedCount).toBe(0);

    // Verify realizabilityAssessment score
    expect(result.realizabilityAssessment.realizabilityScore).toBeCloseTo(93, 0);

    // Verify generatedAt equals executionTimestamp
    expect(result.generatedAt).toBe(1704067200000);
  });

  test('recordMappingGenerationAuditTrail is called once with proper data', async () => {
    const input = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      executionTimestamp: 1704067200000,
    };

    const result = await generateMappingTable(input);

    // Verify recordMappingGenerationAuditTrail was called
    expect(jest.mocked(auditMod.recordMappingGenerationAuditTrail)).toHaveBeenCalled();

    // Verify audit trail call included correct parameters
    const auditCall = jest.mocked(auditMod.recordMappingGenerationAuditTrail).mock.calls[0];
    expect(auditCall[0]).toEqual(
      expect.objectContaining({
        userId: '770e8400-e29b-41d4-a716-446655440002',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      })
    );
  });
});
