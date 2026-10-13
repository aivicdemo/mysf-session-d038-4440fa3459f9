import { recordMappingValidationAuditTrail, InvalidValidationResultError } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-282: 検証結果のvalidationStatusが欠けているときInvalidValidationResultErrorが発生する', () => {
  it('validationResult=nullの入力でInvalidValidationResultErrorが発生し、recordOperationAuditTrailが呼ばれない', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2024',
      mappingDetailId: 'mapping-detail-456',
      validationResult: null as any,
      executionResultStatus: 'failure',
      errorMessage: '検証実行時にnullが渡された',
      ipAddress: '192.168.1.100',
      sessionId: 'session-789',
      operationExecutedAt: new Date('2024-12-15T10:30:00Z'),
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidValidationResultError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
