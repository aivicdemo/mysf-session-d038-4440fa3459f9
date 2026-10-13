import { recordMappingValidationAuditTrail, type RecordMappingValidationAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-293: operationExecutedAtの値がoperationTimestampとして出力レコードに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('operationExecutedAt が operationTimestamp として記録される', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      mappingDetailId: 'mapping-11111',
      validationResult: {
        validationStatus: 'passed',
        detectedIssues: 'none',
        riskLevel: 'low',
        recommendedActions: 'proceed',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123xyz',
      operationExecutedAt: new Date('2026-10-07T14:30:45.000Z'),
    };

    const mockAuditTrailRecord: OperationAuditTrailRecord = {
      auditTrailId: 'audit-99999',
      userId: 'user-12345',
      operationType: 'MAPPING_VALIDATION',
      targetTableName: 'mapping_details',
      targetRecordId: 'mapping-11111',
      changeBeforeValue: undefined,
      changeAfterValue: undefined,
      operationDetails: JSON.stringify({
        validationStatus: 'passed',
        detectedIssues: 'none',
        riskLevel: 'low',
      }),
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123xyz',
      operationStatus: 'success',
      errorMessage: undefined,
      operationTimestamp: '2026-10-07T14:30:45.000Z',
      createdAt: '2026-10-07T14:30:45.000Z',
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(
      mockAuditTrailRecord
    );

    const result = await recordMappingValidationAuditTrail(input);

    expect(result.operationTimestamp).toBe('2026-10-07T14:30:45.000Z');
    expect(result.auditTrailId).toBe('audit-99999');
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('MAPPING_VALIDATION');
    expect(result.targetTableName).toBe('mapping_details');
    expect(result.targetRecordId).toBe('mapping-11111');
    expect(result.operationStatus).toBe('success');
    expect(result.createdAt).toBe('2026-10-07T14:30:45.000Z');
  });
});
