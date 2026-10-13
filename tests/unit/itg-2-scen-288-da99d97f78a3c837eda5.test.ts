import {
  recordMappingValidationAuditTrail,
  InvalidSessionIdError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';

describe('SCEN-288: セッションIDがnullのときInvalidSessionIdErrorが発生する', () => {
  it('should throw InvalidSessionIdError when sessionId is null', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-123',
      projectId: 'proj-456',
      mappingDetailId: 'map-detail-789',
      validationResult: {
        validationStatus: 'passed',
        detectedIssues: 'none',
        riskLevel: 'low',
        recommendedActions: 'proceed'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: null as any,
      operationExecutedAt: new Date('2026-10-07T10:30:00Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidSessionIdError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('セッションIDが指定されていません。');
  });
});
