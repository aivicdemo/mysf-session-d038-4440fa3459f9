import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { recordRiskAssessmentAuditTrail } from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import type { OperationAuditTrailRecord } from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn(),
}));

const mockRecordOperationAuditTrail = mappingPersistence.recordOperationAuditTrail as jest.Mock;

describe('SCEN-302: リスク評価成功時の監査証跡記録', () => {
  beforeEach(() => {
    mockRecordOperationAuditTrail.mockClear();
  });

  it('リスク評価が成功した場合、errorMessageはnullで、operationStatusには「SUCCESS」が設定されて記録される', async () => {
    const mockAuditTrailRecord: OperationAuditTrailRecord = {
      auditTrailId: 'audit-trail-20260115-001',
      userId: 'user-001',
      operationType: 'RISK_ASSESSMENT',
      targetTableName: 'risk_assessment_operations',
      targetRecordId: undefined,
      changeBeforeValue: undefined,
      changeAfterValue: undefined,
      operationDetails:
        'リスク評価を実行。対象システム: target-oracle-erp-001、リスク分類: 高リスク、リスク評価スコア: 7.5',
      ipAddress: '192.168.1.100',
      sessionId: 'session-token-abc123def456',
      operationStatus: 'SUCCESS',
      errorMessage: undefined,
      operationTimestamp: '2026-01-15T10:30:00.000Z',
      createdAt: '2026-01-15T10:30:00.000Z',
    };

    (mockRecordOperationAuditTrail as any).mockResolvedValue(mockAuditTrailRecord);

    const input: any = {
      userId: 'user-001',
      projectId: 'proj-migration-2024-001',
      targetSystemId: 'target-oracle-erp-001',
      riskAssessmentResult: {
        riskClassification: '高リスク',
        riskItemName: 'カスタムオブジェクト請求書の標準オブジェクト化への移行複雑性',
        occurrenceProbabilityLevel: '中',
        impactLevel: '高',
        riskAssessmentScore: 7.5,
        correspondencePolicy: '並行運用期間の設定',
        correspondenceStrategy:
          '請求書・請求明細カスタムオブジェクトのデータマッピングテーブル作成、マイグレーション検証スクリプト開発',
      },
      executionResultStatus: 'SUCCESS',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-token-abc123def456',
      operationExecutedAt: new Date('2026-01-15T10:30:00.000Z'),
    };

    const result = await recordRiskAssessmentAuditTrail(input);

    expect(result.operationStatus).toBe('SUCCESS');
    expect(result.errorMessage).toBeUndefined();
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('RISK_ASSESSMENT');
    expect(result.targetTableName).toBe('risk_assessment_operations');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-token-abc123def456');
    expect(result.operationTimestamp).toBe('2026-01-15T10:30:00.000Z');
    expect(result.auditTrailId).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });
});
