import { recordMappingValidationAuditTrail } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-274: recordMappingValidationAuditTrail - Success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record mapping validation audit trail with all fields valid', async () => {
    const mockAuditRecord = {
      auditTrailId: 'audit-trail-rec-001',
      userId: 'user-001',
      operationType: 'MAPPING_VALIDATION',
      targetTableName: 'mapping_detail',
      targetRecordId: 'mapping-detail-invoice-001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: '{"validationStatus":"passed","detectedIssues":"None","riskLevel":"low","recommendedActions":"Proceed with mapping implementation"}',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123def456',
      operationStatus: 'success',
      errorMessage: null,
      operationTimestamp: '2026-01-15T10:30:45.000Z',
      createdAt: '2026-01-15T10:30:45.000Z',
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockAuditRecord);

    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2026',
      mappingDetailId: 'mapping-detail-invoice-001',
      validationResult: {
        validationStatus: 'passed',
        detectedIssues: 'None',
        riskLevel: 'low',
        recommendedActions: 'Proceed with mapping implementation',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123def456',
      operationExecutedAt: new Date('2026-01-15T10:30:45.000Z'),
    };

    const result = await recordMappingValidationAuditTrail(input);

    expect(result).toEqual(mockAuditRecord);
    expect(result.operationType).toBe('MAPPING_VALIDATION');
    expect(result.operationStatus).toBe('success');
    expect(result.errorMessage).toBeNull();
  });
});
