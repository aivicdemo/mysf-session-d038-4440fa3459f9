import { recordMappingValidationAuditTrail, InvalidUserIdError } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-275: recordMappingValidationAuditTrail - Invalid User ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidUserIdError when userId is empty string', async () => {
    const input = {
      userId: '',
      projectId: 'PROJ-001',
      mappingDetailId: 'MAP-DETAIL-001',
      validationResult: {
        validationStatus: 'completed',
        detectedIssues: 'No issues found',
        riskLevel: 'low',
        recommendedActions: 'Proceed with migration',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.1',
      sessionId: 'SESSION-12345',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(recordMappingValidationAuditTrail(input)).rejects.toThrow(InvalidUserIdError);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
