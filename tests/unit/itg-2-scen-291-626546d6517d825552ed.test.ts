import {
  recordMappingValidationAuditTrail,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn()
}));

describe('SCEN-291: 実行ステータスがfailureのときエラーメッセージが出力レコードに含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include errorMessage in output when executionResultStatus is failure', async () => {
    const mockResult = {
      auditTrailId: 'audit-001',
      userId: 'user-123',
      operationType: 'MappingValidation',
      targetTableName: 'MappingDetails',
      targetRecordId: 'mapping-789',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: 'Validation check for feature mapping field compatibility',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc-def-ghi',
      operationStatus: 'failure',
      errorMessage: 'Validation engine encountered type incompatibility during field mapping analysis',
      operationTimestamp: '2026-10-07T14:30:00.000Z',
      createdAt: '2026-10-07T14:30:00.000Z'
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockResult);

    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-123',
      projectId: 'proj-456',
      mappingDetailId: 'mapping-789',
      validationResult: {
        validationStatus: 'failed',
        detectedIssues: 'Field type mismatch: Source is Numeric, Target is Text',
        riskLevel: 'high',
        recommendedActions: 'Implement data type conversion logic'
      },
      executionResultStatus: 'failure',
      errorMessage: 'Validation engine encountered type incompatibility during field mapping analysis',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-abc-def-ghi',
      operationExecutedAt: new Date('2026-10-07T14:30:00.000Z')
    };

    const result = await recordMappingValidationAuditTrail(input);

    expect(result.errorMessage).toBe('Validation engine encountered type incompatibility during field mapping analysis');
    expect(result.operationStatus).toBe('failure');
    expect(result.auditTrailId).toBe('audit-001');
    expect(result.userId).toBe('user-123');
    expect(result.operationType).toBe('MappingValidation');
    expect(result.targetTableName).toBe('MappingDetails');
    expect(result.targetRecordId).toBe('mapping-789');
    expect(result.operationTimestamp).toBe('2026-10-07T14:30:00.000Z');
    expect(result.createdAt).toBe('2026-10-07T14:30:00.000Z');
  });
});
