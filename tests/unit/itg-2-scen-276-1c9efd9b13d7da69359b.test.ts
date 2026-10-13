import { recordMappingValidationAuditTrail, InvalidUserIdError, type RecordMappingValidationAuditTrailInput } from '../../src/logic/audit-trail-service';

describe('SCEN-276: ユーザーIDがnullのときInvalidUserIdErrorが発生する', () => {
  it('should throw InvalidUserIdError when userId is null', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: null as any,
      projectId: 'proj-12345',
      mappingDetailId: 'map-detail-001',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'Field mismatch on amount',
        riskLevel: 'medium',
        recommendedActions: 'Review field mapping',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-67890',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    const error = await recordMappingValidationAuditTrail(input).catch(e => e);
    expect(error).toBeInstanceOf(InvalidUserIdError);
    expect(error.message).toBe('ユーザーID が指定されていません。');
  });
});
