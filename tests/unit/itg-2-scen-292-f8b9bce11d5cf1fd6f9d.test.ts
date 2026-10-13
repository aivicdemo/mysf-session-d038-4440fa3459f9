import {
  recordMappingValidationAuditTrail,
  type RecordMappingValidationAuditTrailInput
} from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  recordOperationAuditTrail: jest.fn()
}));

describe('SCEN-292: 実行ステータスがpartialのときauditTrailIdが生成されて出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return auditTrailId when executionResultStatus is partial', async () => {
    const mockResult = {
      auditTrailId: 'audit-trail-55555',
      userId: 'user-12345',
      operationType: 'MAPPING_VALIDATION',
      targetTableName: 'MappingValidation',
      targetRecordId: 'mapping-detail-11111',
      changeBeforeValue: null,
      changeAfterValue: 'partial',
      operationDetails: '検証ステータス: partial, 検出問題: フィールド型の不一致が2件検出されました, リスクレベル: medium',
      ipAddress: '192.168.1.100',
      sessionId: 'session-99999',
      operationStatus: 'partial',
      errorMessage: null,
      operationTimestamp: '2026-10-15T14:30:45.123Z',
      createdAt: '2026-10-15T14:30:45.123Z'
    };

    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockResult);

    const input: RecordMappingValidationAuditTrailInput = {
      userId: 'user-12345',
      projectId: 'proj-67890',
      mappingDetailId: 'mapping-detail-11111',
      validationResult: {
        validationStatus: 'partial',
        detectedIssues: 'フィールド型の不一致が2件検出されました',
        riskLevel: 'medium',
        recommendedActions: '型変換ロジックの追加を検討してください'
      },
      executionResultStatus: 'partial',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-99999',
      operationExecutedAt: new Date('2026-10-15T14:30:45.123Z')
    };

    const result = await recordMappingValidationAuditTrail(input);

    expect(result.auditTrailId).toBe('audit-trail-55555');
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('MAPPING_VALIDATION');
    expect(result.targetTableName).toBe('MappingValidation');
    expect(result.targetRecordId).toBe('mapping-detail-11111');
    expect(result.changeBeforeValue).toBeNull();
    expect(result.changeAfterValue).toBe('partial');
    expect(result.operationDetails).toBe('検証ステータス: partial, 検出問題: フィールド型の不一致が2件検出されました, リスクレベル: medium');
    expect(result.ipAddress).toBe('192.168.1.100');
    expect(result.sessionId).toBe('session-99999');
    expect(result.operationStatus).toBe('partial');
    expect(result.errorMessage).toBeNull();
    expect(result.operationTimestamp).toBe('2026-10-15T14:30:45.123Z');
    expect(result.createdAt).toBe('2026-10-15T14:30:45.123Z');
  });
});
