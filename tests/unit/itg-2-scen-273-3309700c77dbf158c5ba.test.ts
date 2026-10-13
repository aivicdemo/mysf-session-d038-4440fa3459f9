import { recordMappingGenerationAuditTrail } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-273: recordMappingGenerationAuditTrail - Failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record mapping generation audit trail with failure status and error message', async () => {
    const mockUser = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      authenticated: true,
      authorized: true,
    };

    const mockProjectContext = {
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      resolved: true,
    };

    const mockAuditRecord = {
      auditTrailId: 'aud-99999-ffff-11111',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'MAPPING_GENERATION',
      targetTableName: 'operation_audit_trail',
      targetRecordId: '880e8400-e29b-41d4-a716-446655440003',
      changeBeforeValue: null,
      changeAfterValue: null,
      operationDetails: '機能マッピング表生成操作: targetObjectId=880e8400-e29b-41d4-a716-446655440003, projectId=660e8400-e29b-41d4-a716-446655440001',
      ipAddress: '192.168.1.100',
      sessionId: 'session-12345-abcde-67890',
      operationStatus: 'failure',
      errorMessage: '対象システムメタデータの取得タイムアウト。処理は中断されました。',
      operationTimestamp: '2026-01-15T09:30:45.000Z',
      createdAt: '2026-01-15T09:30:45.000Z',
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockAuditRecord);

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      targetObjectId: '880e8400-e29b-41d4-a716-446655440003',
      mappingResult: {
        mappingTableId: 'map-001',
        generatedAt: '2026-01-15T09:30:45.000Z',
        status: 'generated',
      },
      executionResultStatus: 'failure',
      errorMessage: '対象システムメタデータの取得タイムアウト。処理は中断されました。',
      ipAddress: '192.168.1.100',
      sessionId: 'session-12345-abcde-67890',
      operationExecutedAt: new Date('2026-01-15T09:30:45.000Z'),
    };

    const result = await recordMappingGenerationAuditTrail(input);

    expect(result).toEqual(mockAuditRecord);
    expect(result.operationStatus).toBe('failure');
    expect(result.errorMessage).toBe('対象システムメタデータの取得タイムアウト。処理は中断されました。');
  });
});
