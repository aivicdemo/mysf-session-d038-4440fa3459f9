import { recordMappingGenerationAuditTrail } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-272: recordMappingGenerationAuditTrail - Partial Success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record mapping generation audit trail with partial_success status and error message', async () => {
    const mockUser = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      authenticated: true,
      authorized: true,
      username: 'migration_operator',
      roles: ['MappingOperator', 'ProjectMember'],
    };

    const mockProjectContext = {
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      resolved: true,
      accessGranted: true,
      projectName: 'Salesforce_to_ERP_Migration',
    };

    const mockAuditRecord = {
      auditTrailId: 'aat-550e8400-e29b-41d4-a716-446655440006',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      operationType: 'MAPPING_GENERATION',
      targetTableName: 'operation_audit_trail',
      targetRecordId: '990e8400-e29b-41d4-a716-446655440004',
      changeBeforeValue: null,
      changeAfterValue: 'Invoice__c→AR_INVOICE: 1 success, 1 failure',
      operationDetails: '機能マッピング表生成操作。対象: Invoice__c カスタムオブジェクト、移行対象: AR_INVOICE テーブル。マッピング結果: 成功1件、失敗1件、未マッピング送信元1件・送信先1件。',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-550e8400-e29b-41d4-a716-446655440005',
      operationStatus: 'partial_success',
      errorMessage: '2 of 3 field mappings completed. Invoice amount field has data type mismatch with target system.',
      operationTimestamp: '2026-10-08T14:30:45.123Z',
      createdAt: '2026-10-08T14:30:45.123Z',
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
        mappingId: '990e8400-e29b-41d4-a716-446655440004',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'AR_INVOICE',
        mappedFields: [
          { sourceField: 'InvoiceNumber__c', targetField: 'INVOICE_NO', mappingStatus: 'success' },
          { sourceField: 'InvoiceAmount__c', targetField: 'TOTAL_AMOUNT', mappingStatus: 'failed', errorReason: 'Data type mismatch: Currency vs Number(10,2)' },
        ],
        unmappedSourceFields: ['CustomField1__c'],
        unmappedTargetFields: ['TAX_CODE'],
        successCount: 1,
        failureCount: 1,
        partialSuccessCount: 0,
      },
      executionResultStatus: 'partial_success',
      errorMessage: '2 of 3 field mappings completed. Invoice amount field has data type mismatch with target system.',
      ipAddress: '192.168.1.100',
      sessionId: 'sess-550e8400-e29b-41d4-a716-446655440005',
      operationExecutedAt: new Date('2026-10-08T14:30:45.123Z'),
    };

    const result = await recordMappingGenerationAuditTrail(input);

    expect(result).toEqual(mockAuditRecord);
    expect(result.operationStatus).toBe('partial_success');
    expect(result.errorMessage).toBe('2 of 3 field mappings completed. Invoice amount field has data type mismatch with target system.');
    expect(result.changeAfterValue).toBe('Invoice__c→AR_INVOICE: 1 success, 1 failure');
  });
});
