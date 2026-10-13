import {
  recordMappingValidationAuditTrail,
  InvalidSessionIdError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';

describe('SCEN-287: セッションIDが空文字列のときInvalidSessionIdErrorが発生する', () => {
  it('should throw InvalidSessionIdError when sessionId is empty string', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'USER-001',
      projectId: 'PROJ-2025-001',
      mappingDetailId: 'MAP-DETAIL-001',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'No issues detected',
        riskLevel: 'low',
        recommendedActions: 'Proceed with mapping'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: '',
      operationExecutedAt: new Date('2025-01-15T10:30:00.000Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidSessionIdError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('セッションIDが指定されていません。');
  });
});
