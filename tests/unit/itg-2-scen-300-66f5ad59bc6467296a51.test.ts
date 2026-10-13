import { recordRiskAssessmentAuditTrail, AuditTrailPersistenceException } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

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

describe('SCEN-300: recordRiskAssessmentAuditTrail - AuditTrailPersistenceException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuditTrailPersistenceException when recordOperationAuditTrail fails', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      riskAssessmentResult: {
        riskClassification: 'HIGH',
        riskItemName: 'カスタムオブジェクト請求書の複雑な計算式移行',
        probabilityLevel: 3,
        impactLevel: 4,
        riskScore: 85,
        correspondencePolicy: 'リスク軽減',
        correspondenceMeasure: '段階的マイグレーション計画の策定',
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId: 'user-001',
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
    });

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockRejectedValue(
      new Error('Database connection error'),
    );

    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(AuditTrailPersistenceException);
    try {
      await recordRiskAssessmentAuditTrail(input);
    } catch (error) {
      expect(error instanceof AuditTrailPersistenceException).toBe(true);
      expect((error as Error).message).toContain('操作履歴の記録に失敗しました。システム管理者に連絡してください。');
    }
  });
});
