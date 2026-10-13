import {
  recordMappingValidationAuditTrail,
  InvalidExecutionStatusError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';

describe('SCEN-284: 実行ステータスが定義済みの値（success, failure, partial）以外のときInvalidExecutionStatusErrorが発生する', () => {
  it('should throw InvalidExecutionStatusError when executionResultStatus is invalid', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-123',
      projectId: 'proj-456',
      mappingDetailId: 'mapping-789',
      validationResult: {
        validationStatus: 'passed',
        detectedIssues: 'No issues detected',
        riskLevel: 'low',
        recommendedActions: 'None'
      },
      executionResultStatus: 'invalid_status',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidExecutionStatusError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('実行ステータスが無効な値です。');
  });
});
