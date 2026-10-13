import {
  recordMappingValidationAuditTrail,
  InvalidIpAddressError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';

describe('SCEN-286: IPアドレスがnullのときInvalidIpAddressErrorが発生する', () => {
  it('should throw InvalidIpAddressError when ipAddress is null', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-001',
      projectId: 'proj-migration-2025',
      mappingDetailId: 'mapping-detail-456',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'フィールドマッピング不完全',
        riskLevel: 'high',
        recommendedActions: '追加フィールド確認が必要'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: null as any,
      sessionId: 'session-xyz789',
      operationExecutedAt: new Date('2025-01-15T10:30:00Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidIpAddressError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('IPアドレスが指定されていません。');
  });
});
