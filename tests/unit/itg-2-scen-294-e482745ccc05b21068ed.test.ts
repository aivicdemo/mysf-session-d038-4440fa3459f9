import { recordMappingValidationAuditTrail, type RecordMappingValidationAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-294: validationResult のすべてのフィールドが operationDetails に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('validationResult のすべてのフィールド（validationStatus, detectedIssues, riskLevel, recommendedActions）と projectId, mappingDetailId が operationDetails に含まれる', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      mappingDetailId: 'map-detail-11111',
      validationResult: {
        validationStatus: 'warning',
        detectedIssues: 'Field type mismatch: Oracle NUMBER vs Salesforce Currency',
        riskLevel: 'high',
        recommendedActions: 'Manual review required for decimal precision',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123xyz',
      operationExecutedAt: new Date('2025-06-15T14:30:00Z'),
    };

    const mockAuditTrailRecord: OperationAuditTrailRecord = {
      auditTrailId: 'audit-99999',
      userId: 'user-12345',
      operationType: 'MAPPING_VALIDATION',
      targetTableName: 'MappingValidation',
      targetRecordId: 'map-detail-11111',
      changeBeforeValue: undefined,
      changeAfterValue: undefined,
      operationDetails: JSON.stringify({
        validationStatus: 'warning',
        detectedIssues: 'Field type mismatch: Oracle NUMBER vs Salesforce Currency',
        riskLevel: 'high',
        recommendedActions: 'Manual review required for decimal precision',
        projectId: 'proj-67890',
        mappingDetailId: 'map-detail-11111',
      }),
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123xyz',
      operationStatus: 'success',
      errorMessage: undefined,
      operationTimestamp: '2025-06-15T14:30:00Z',
      createdAt: '2025-06-15T14:30:00Z',
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(
      mockAuditTrailRecord
    );

    const result = await recordMappingValidationAuditTrail(input);

    expect(result).toBeDefined();
    expect(result.operationDetails).toBeDefined();

    const operationDetailsObj = JSON.parse(result.operationDetails as string);
    expect(operationDetailsObj.validationStatus).toBe('warning');
    expect(operationDetailsObj.detectedIssues).toBe('Field type mismatch: Oracle NUMBER vs Salesforce Currency');
    expect(operationDetailsObj.riskLevel).toBe('high');
    expect(operationDetailsObj.recommendedActions).toBe('Manual review required for decimal precision');
    expect(operationDetailsObj.projectId).toBe('proj-67890');
    expect(operationDetailsObj.mappingDetailId).toBe('map-detail-11111');

    expect(result.auditTrailId).toBe('audit-99999');
    expect(result.operationStatus).toBe('success');
    expect(result.operationTimestamp).toBe('2025-06-15T14:30:00Z');
    expect(result.createdAt).toBe('2025-06-15T14:30:00Z');
  });
});
