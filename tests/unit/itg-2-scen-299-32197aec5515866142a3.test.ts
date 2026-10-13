import { recordRiskAssessmentAuditTrail, InvalidRiskAssessmentDataException, RecordRiskAssessmentAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

describe('SCEN-299: recordRiskAssessmentAuditTrail - Invalid Risk Assessment Data', () => {
  it('should throw InvalidRiskAssessmentDataException when required fields are missing from riskAssessmentResult', async () => {
    const input: RecordRiskAssessmentAuditTrailInput = {
      userId: 'user-001',
      projectId: 'proj-migrate-2026',
      targetSystemId: 'target-oracle-erp',
      riskAssessmentResult: {
        riskCategory: 'HIGH',
        itemName: 'Custom Field Migration',
        // Missing required fields: occurrencePossibilityLevel, impactLevel, riskScore, mitigationPolicy, mitigationStrategy
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-123',
      operationExecutedAt: new Date('2026-01-15T10:30:00Z'),
    };

    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(InvalidRiskAssessmentDataException);
    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow('リスク評価結果のデータ形式が不正です。');

    // Verify that recordOperationAuditTrail was not called
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
