import {
  recordMappingValidationAuditTrail,
  AuditTrailPersistenceError,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn()
}));

describe('SCEN-289: recordOperationAuditTrailの戻り値がnullまたは失敗を示すときAuditTrailPersistenceErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuditTrailPersistenceError when recordOperationAuditTrail returns null', async () => {
    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(null);

    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      mappingDetailId: 'map-detail-11111',
      validationResult: {
        validationStatus: 'warning',
        detectedIssues: 'Field type mismatch',
        riskLevel: 'medium',
        recommendedActions: 'Review field mapping'
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-98765',
      operationExecutedAt: new Date('2026-10-07T10:30:45.000Z')
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(AuditTrailPersistenceError);
    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow('操作履歴の記録に失敗しました。');
  });
});
