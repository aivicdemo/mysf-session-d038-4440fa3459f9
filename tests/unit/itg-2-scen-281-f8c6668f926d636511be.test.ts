import { recordMappingValidationAuditTrail, InvalidValidationResultError } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-281: 検証結果がnullのときInvalidValidationResultErrorが発生する', () => {
  it('validationResult=nullの入力でInvalidValidationResultErrorが発生し、recordOperationAuditTrailが呼ばれない', async () => {
    const input = {
      userId: 'user-123',
      projectId: 'proj-456',
      mappingDetailId: 'mapping-789',
      validationResult: null as any,
      executionResultStatus: 'failure',
      errorMessage: '検証実行時にエラーが発生しました',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-def',
      operationExecutedAt: new Date('2026-10-07T12:34:56Z'),
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidValidationResultError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
