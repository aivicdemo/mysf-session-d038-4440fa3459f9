import {
  recordMappingValidationAuditTrail,
  InvalidIpAddressError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';

describe('SCEN-285: IPアドレスが空文字列のときInvalidIpAddressErrorが発生する', () => {
  it('should throw InvalidIpAddressError when ipAddress is empty string', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      mappingDetailId: 'map-detail-001',
      validationResult: {
        validationStatus: 'success',
        detectedIssues: 'No issues detected',
        riskLevel: 'low',
        recommendedActions: 'Proceed with mapping'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '',
      sessionId: 'session-xyz789',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidIpAddressError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('IPアドレスが指定されていません。');
  });
});
