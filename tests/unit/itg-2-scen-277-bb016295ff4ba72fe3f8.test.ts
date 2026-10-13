import { recordMappingValidationAuditTrail, InvalidProjectIdError, type RecordMappingValidationAuditTrailInput } from '../../src/logic/audit-trail-service';

describe('SCEN-277: プロジェクトIDが空文字列のときInvalidProjectIdErrorが発生する', () => {
  it('should throw InvalidProjectIdError when projectId is empty string', async () => {
    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-001',
      projectId: '',
      mappingDetailId: 'mapping-detail-001',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'No issues found',
        riskLevel: 'low',
        recommendedActions: 'Proceed with mapping',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-001',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    const error = await recordMappingValidationAuditTrail(input).catch(e => e);
    expect(error).toBeInstanceOf(InvalidProjectIdError);
    expect(error.message).toBe('プロジェクトID が指定されていません。');
  });
});
