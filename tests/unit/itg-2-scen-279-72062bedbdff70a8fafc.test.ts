import { recordMappingValidationAuditTrail, InvalidMappingDetailIdError } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-279: 機能マッピング詳細IDが空文字列のときInvalidMappingDetailIdErrorが発生する', () => {
  it('mappingDetailId=空文字列の入力でInvalidMappingDetailIdErrorが発生し、recordOperationAuditTrailが呼ばれない', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2026',
      mappingDetailId: '',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'Field type mismatch detected',
        riskLevel: 'medium',
        recommendedActions: 'Review field mapping configuration',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidMappingDetailIdError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
