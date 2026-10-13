import { recordRiskAssessmentAuditTrail, type RecordRiskAssessmentAuditTrailInput } from '../../src/logic/audit-trail-service';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

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

describe('SCEN-295: ユーザーが認証済みでプロジェクトへのアクセス権を持ち、対象システムが有効な状態で、リスク評価が成功したとき、全ての入力情報を含む操作履歴レコードが記録されて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('すべての入力情報を含む操作履歴レコードが記録されて返される', async () => {
    const input: RecordRiskAssessmentAuditTrailInput = {
      userId: 'user-authenticated-001',
      projectId: 'proj-migration-2024-001',
      targetSystemId: 'oracle-erp-system-001',
      riskAssessmentResult: {
        riskCategory: '高',
        riskItemName: 'カスタムオブジェクト請求書の計算式互換性',
        occurrenceProbability: '中',
        businessImpact: '高',
        assessmentScore: 7.5,
        mitigationStrategy: '計算式の段階的移行、Salesforceフロー導入',
        mitigationActions: [
          '段階1: 計算ロジック分析',
          '段階2: Salesforceフロー実装',
          '段階3: 検証テスト実施',
        ],
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-token-abc123def456',
      operationExecutedAt: new Date('2025-01-15T09:30:45.000Z'),
    };

    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-authenticated-001',
      hasProjectAccess: true,
      projectId: 'proj-migration-2024-001',
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-2024-001',
      targetSystemId: 'oracle-erp-system-001',
      isValid: true,
      projectStatus: 'active',
      userAccessLevel: 'admin',
    });

    const mockAuditTrailRecord: OperationAuditTrailRecord = {
      auditTrailId: expect.any(String),
      userId: 'user-authenticated-001',
      operationType: 'RISK_ASSESSMENT',
      targetTableName: 'risk_assessments',
      targetRecordId: undefined,
      changeBeforeValue: undefined,
      changeAfterValue: JSON.stringify({
        riskCategory: '高',
        riskItemName: 'カスタムオブジェクト請求書の計算式互換性',
        occurrenceProbability: '中',
        businessImpact: '高',
        assessmentScore: 7.5,
        mitigationStrategy: '計算式の段階的移行、Salesforceフロー導入',
        mitigationActions: [
          '段階1: 計算ロジック分析',
          '段階2: Salesforceフロー実装',
          '段階3: 検証テスト実施',
        ],
      }),
      operationDetails: 'projectId=proj-migration-2024-001, targetSystemId=oracle-erp-system-001 に対するリスク評価実行',
      ipAddress: '192.168.1.100',
      sessionId: 'session-token-abc123def456',
      operationStatus: 'SUCCESS',
      errorMessage: undefined,
      operationTimestamp: expect.stringMatching(/Z$/),
      createdAt: expect.stringMatching(/Z$/),
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(
      mockAuditTrailRecord
    );

    const result = await recordRiskAssessmentAuditTrail(input);

    expect(result).toBeDefined();
    expect(result.userId).toBe('user-authenticated-001');
    expect(result.operationType).toBe('RISK_ASSESSMENT');
    expect(result.targetTableName).toBe('risk_assessments');
    expect(result.operationStatus).toBe('SUCCESS');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-token-abc123def456');
    expect(result.operationTimestamp).toMatch(/Z$/);
    expect(result.createdAt).toMatch(/Z$/);

    const changeAfterValue = JSON.parse(result.changeAfterValue as string);
    expect(changeAfterValue).toEqual({
      riskCategory: '高',
      riskItemName: 'カスタムオブジェクト請求書の計算式互換性',
      occurrenceProbability: '中',
      businessImpact: '高',
      assessmentScore: 7.5,
      mitigationStrategy: '計算式の段階的移行、Salesforceフロー導入',
      mitigationActions: [
        '段階1: 計算ロジック分析',
        '段階2: Salesforceフロー実装',
        '段階3: 検証テスト実施',
      ],
    });
  });
});
