import {
  recordMappingValidationAuditTrail,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn()
}));

describe('SCEN-290: 実行ステータスがsuccessのときauditTrailIdが生成されて出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return auditTrailId when executionResultStatus is success', async () => {
    const mockResult = {
      auditTrailId: 'audit-trail-20261008-001',
      userId: 'user-001',
      operationType: 'MAPPING_VALIDATION',
      targetTableName: 'MappingDetail',
      targetRecordId: 'mapping-detail-001',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: 'Mapping validation executed successfully with result: passed',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123def456',
      operationStatus: 'success',
      errorMessage: null,
      operationTimestamp: '2026-10-08T14:30:00Z',
      createdAt: '2026-10-08T14:30:00.000Z'
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockResult);

    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-001',
      projectId: 'proj-2024-001',
      mappingDetailId: 'mapping-detail-001',
      validationResult: {
        validationStatus: 'passed',
        detectedIssues: 'None',
        riskLevel: 'low',
        recommendedActions: 'Proceed with migration'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123def456',
      operationExecutedAt: new Date('2026-10-08T14:30:00Z')
    };

    const result = await recordMappingValidationAuditTrail(input);

    expect(result.auditTrailId).toBe('audit-trail-20261008-001');
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('MAPPING_VALIDATION');
    expect(result.targetTableName).toBe('MappingDetail');
    expect(result.targetRecordId).toBe('mapping-detail-001');
    expect(result.operationDetails).toBe('Mapping validation executed successfully with result: passed');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-abc123def456');
    expect(result.operationStatus).toBe('success');
    expect(result.operationTimestamp).toBe('2026-10-08T14:30:00Z');
    expect(result.createdAt).toBe('2026-10-08T14:30:00.000Z');
  });
});
