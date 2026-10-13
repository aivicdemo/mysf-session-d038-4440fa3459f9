import { recordMappingGenerationAuditTrail } from '../../src/logic/audit-trail-service';
import * as auditTrailService from '../../src/logic/audit-trail-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-266: recordMappingGenerationAuditTrail - Success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record mapping generation audit trail with success status', async () => {
    const mockUser = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      isAuthenticated: true,
      hasPermission: true,
    };

    const mockProjectContext = {
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440002',
      isResolved: true,
    };

    const mockAuditRecord = {
      auditTrailId: '550e8400-e29b-41d4-a716-446655440006',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'MAPPING_GENERATION',
      targetTableName: 'operation_audit_trail',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440003',
      changeBeforeValue: null,
      changeAfterValue: '550e8400-e29b-41d4-a716-446655440004',
      operationDetails: '機能マッピング表生成: Invoice__c オブジェクト、フィールドマッピング2件',
      ipAddress: '192.0.2.100',
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440005',
      operationStatus: 'success',
      errorMessage: null,
      operationTimestamp: '2026-10-07T06:31:45.000Z',
      createdAt: '2026-10-07T06:31:45.000Z',
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(mockAuditRecord);

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440002',
      targetObjectId: '550e8400-e29b-41d4-a716-446655440003',
      mappingResult: {
        fieldMappings: [
          { sourceField: 'invoice_id', targetField: 'Invoice_Number__c', mappingType: 'direct' },
          { sourceField: 'invoice_amount', targetField: 'Total_Amount__c', mappingType: 'direct' },
        ],
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.0.2.100',
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440005',
      operationExecutedAt: new Date('2026-10-07T06:31:45.000Z'),
    };

    const result = await recordMappingGenerationAuditTrail(input);

    expect(result).toEqual(mockAuditRecord);
    expect(result.operationStatus).toBe('success');
    expect(result.errorMessage).toBeNull();
  });
});
