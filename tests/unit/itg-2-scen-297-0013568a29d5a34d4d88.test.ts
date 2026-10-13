import { recordRiskAssessmentAuditTrail, UserUnauthorizedException, type RecordRiskAssessmentAuditTrailInput } from '../../src/logic/audit-trail-service';
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

describe('SCEN-297: ユーザーは認証されているが当該プロジェクトへのアクセス権を持たないとき、UserUnauthorizedExceptionが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ユーザーが認証されているがアクセス権を持たないとき、UserUnauthorizedException が発生し、メッセージが正しい', async () => {
    const input: RecordRiskAssessmentAuditTrailInput = {
      userId: 'user-001',
      projectId: 'project-001',
      targetSystemId: 'system-001',
      riskAssessmentResult: {
        riskClassification: 'HIGH',
        riskItemName: 'カスタムオブジェクト請求書のフィールドマッピング不完全',
        probabilityLevel: 'MEDIUM',
        impactLevel: 'HIGH',
        riskAssessmentScore: 7.5,
        countermeasurePlan: '段階的移行とバリデーション強化',
        countermeasure: 'Oracleの請求テーブルとのギャップ分析を実施',
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-token-abc123',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new UserUnauthorizedException('このプロジェクトへのアクセス権がありません。')
    );

    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(UserUnauthorizedException);
    await expect(recordRiskAssessmentAuditTrail(input)).rejects.toThrow(
      'このプロジェクトへのアクセス権がありません。'
    );
  });
});
