import { recordRiskAssessmentAuditTrail, ProjectContextInvalidException, type RecordRiskAssessmentAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

describe('SCEN-298: 指定されたプロジェクトIDまたは移行対象システムIDが存在しないか無効な状態であるとき、ProjectContextInvalidExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('projectId が存在しないため ProjectContextInvalidException が発生する', async () => {
    const input: RecordRiskAssessmentAuditTrailInput = {
      userId: 'user-001',
      projectId: 'project-invalid-id',
      targetSystemId: 'system-001',
      riskAssessmentResult: {
        riskClassification: 'HIGH',
        riskItemName: 'データ型不一致',
        occurrenceProbability: 'HIGH',
        impactLevel: 'CRITICAL',
        riskScore: 85,
        correspondencePolicy: 'カスタムフィールド追加による対応',
        correspondenceStrategy: 'Salesforceの請求書オブジェクトに移行対象システムの計算ロジックを実装',
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId: 'user-001',
      isAuthenticated: true,
      hasProjectAccess: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(ProjectContextInvalidException);
    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(
      'プロジェクトまたは移行対象システムが見つかりません。'
    );
  });
});
