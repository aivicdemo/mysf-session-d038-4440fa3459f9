import { recordRiskAssessmentAuditTrail, RecordRiskAssessmentAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as authAuthority from '../../src/logic/authentication-authorization';
import * as projectResolver from '../../src/logic/project-context-resolver';

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

describe('SCEN-301: recordRiskAssessmentAuditTrail - Failed Risk Assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record risk assessment audit trail with FAILURE status and error message', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-001',
      projectIds: ['proj-migration-2026'],
    };

    const mockProjectContext = {
      projectId: 'proj-migration-2026',
      targetSystemId: 'oracle-billing-system',
      isValid: true,
    };

    const mockAuditTrailRecord = {
      auditTrailId: 'audit-trail-20261015-001',
      userId: 'user-001',
      operationType: 'RISK_ASSESSMENT',
      targetTableName: 'risk_assessment_operations',
      targetRecordId: 'oracle-billing-system',
      changeBeforeValue: undefined,
      changeAfterValue: JSON.stringify({
        riskClassification: 'technical',
        riskItemName: 'カスタムフィールドマッピングギャップ',
        likelihoodLevel: 'high',
        impactLevel: 'high',
        riskScore: 85,
        mitigationPolicy: 'カスタムフィールド変換ロジックを開発',
      }),
      operationDetails: '移行リスク評価の実行操作をユーザー・評価対象・評価結果・実行ステータスとともに操作履歴テーブルに記録',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-12345',
      operationStatus: 'FAILURE',
      errorMessage: 'リスク評価実行中にデータベース接続エラーが発生しました',
      operationTimestamp: '2026-10-15T14:30:00.000Z',
      createdAt: expect.any(String),
    };

    (authAuthority.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockAuditTrailRecord);

    const input: RecordRiskAssessmentAuditTrailInput = {
      userId: 'user-001',
      projectId: 'proj-migration-2026',
      targetSystemId: 'oracle-billing-system',
      riskAssessmentResult: {
        riskClassification: 'technical',
        riskItemName: 'カスタムフィールドマッピングギャップ',
        likelihoodLevel: 'high',
        impactLevel: 'high',
        riskScore: 85,
        mitigationPolicy: 'カスタムフィールド変換ロジックを開発',
      },
      executionResultStatus: 'FAILURE',
      errorMessage: 'リスク評価実行中にデータベース接続エラーが発生しました',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc-12345',
      operationExecutedAt: new Date('2026-10-15T14:30:00.000Z'),
    };

    const result = await recordRiskAssessmentAuditTrail(input);

    // Verify the result structure and content
    expect(result.auditTrailId).toBe('audit-trail-20261015-001');
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('RISK_ASSESSMENT');
    expect(result.targetTableName).toBe('risk_assessment_operations');
    expect(result.targetRecordId).toBe('oracle-billing-system');
    expect(result.changeBeforeValue).toBeUndefined();
    expect(result.changeAfterValue).toContain('technical');
    expect(result.changeAfterValue).toContain('カスタムフィールドマッピングギャップ');
    expect(result.operationDetails).toBe('移行リスク評価の実行操作をユーザー・評価対象・評価結果・実行ステータスとともに操作履歴テーブルに記録');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-abc-12345');
    expect(result.operationStatus).toBe('FAILURE');
    expect(result.errorMessage).toBe('リスク評価実行中にデータベース接続エラーが発生しました');
    expect(result.operationTimestamp).toBe('2026-10-15T14:30:00.000Z');
    expect(result.createdAt).toBeDefined();

    // Verify that verifyUserAuthenticationAndAuthorization was called
    expect(authAuthority.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();

    // Verify that resolveProjectContext was called
    expect(projectResolver.resolveProjectContext).toHaveBeenCalled();

    // Verify that recordOperationAuditTrail was called
    expect(mappingPersistence.recordOperationAuditTrail).toHaveBeenCalled();
  });
});
