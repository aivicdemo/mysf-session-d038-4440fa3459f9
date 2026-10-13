import { recordRiskAssessmentAuditTrail, UserNotAuthenticatedException, type RecordRiskAssessmentAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as authorizationModule from '../../src/logic/authentication-authorization';

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

describe('SCEN-296: ユーザーが認証されていないとき、UserNotAuthenticatedExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ユーザーが認証されていないとき、UserNotAuthenticatedException が発生し、例外メッセージが正しい', async () => {
    const input: RecordRiskAssessmentAuditTrailInput = {
      userId: 'user-unauthenticated-001',
      projectId: 'proj-migration-2024-001',
      targetSystemId: 'target-sys-oracle-billing',
      riskAssessmentResult: {
        riskClassification: '高リスク',
        riskItemName: 'カスタム請求オブジェクト構造の非互換性',
        probabilityLevel: '高',
        impactLevel: '高',
        riskScore: 85,
        responsePolicy: 'リスク軽減',
        countermeasure: '段階的マイグレーション戦略の採用',
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-invalid-token-12345',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new UserNotAuthenticatedException('ユーザー認証に失敗しました。再度ログインしてください。')
    );

    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(UserNotAuthenticatedException);
    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(
      'ユーザー認証に失敗しました。再度ログインしてください。'
    );
  });
});
