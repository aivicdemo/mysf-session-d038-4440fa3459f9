import { recordMappingValidationAuditTrail, InvalidProjectIdError } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-278: プロジェクトIDがnullのときInvalidProjectIdErrorが発生する', () => {
  it('projectId=nullの入力でInvalidProjectIdErrorが発生し、recordOperationAuditTrailが呼ばれない', async () => {
    const input = {
      userId: 'user-001',
      projectId: null as any,
      mappingDetailId: 'mapping-detail-001',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'No issues detected',
        riskLevel: 'low',
        recommendedActions: 'Proceed with mapping',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-12345',
      operationExecutedAt: new Date('2026-10-07T10:00:00Z'),
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidProjectIdError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
