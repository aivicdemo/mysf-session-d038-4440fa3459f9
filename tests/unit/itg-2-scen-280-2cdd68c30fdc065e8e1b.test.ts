import { recordMappingValidationAuditTrail, InvalidMappingDetailIdError } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-280: 機能マッピング詳細IDがnullのときInvalidMappingDetailIdErrorが発生する', () => {
  it('mappingDetailId=nullの入力でInvalidMappingDetailIdErrorが発生し、recordOperationAuditTrailが呼ばれない', async () => {
    const input = {
      userId: 'user-123',
      projectId: 'proj-456',
      mappingDetailId: null as any,
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'No issues found',
        riskLevel: 'low',
        recommendedActions: 'None',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-789',
      operationExecutedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidMappingDetailIdError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
