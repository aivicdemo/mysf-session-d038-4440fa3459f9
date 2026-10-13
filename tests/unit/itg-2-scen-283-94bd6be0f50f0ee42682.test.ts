import {
  recordMappingValidationAuditTrail,
  InvalidValidationResultError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';

describe('SCEN-283: 検証結果のdetectedIssuesが欠けているときInvalidValidationResultErrorが発生する', () => {
  it('should throw InvalidValidationResultError when detectedIssues is null', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-123',
      projectId: 'proj-456',
      mappingDetailId: 'mapping-789',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: null as any,
        riskLevel: 'high',
        recommendedActions: 'review_mapping'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationExecutedAt: new Date('2026-10-08T10:30:00Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidValidationResultError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('検証結果の形式が不正です。');
  });
});
