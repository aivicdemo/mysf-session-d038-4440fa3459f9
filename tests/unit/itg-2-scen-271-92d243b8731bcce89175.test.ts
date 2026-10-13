import { recordMappingGenerationAuditTrail, AuditTrailPersistenceException } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-271: recordMappingGenerationAuditTrail - Persistence Failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuditTrailPersistenceException when audit trail persistence fails', async () => {
    const mockUser = {
      userId: 'user-001',
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.recordOperationAuditTrail as jest.Mock).mockResolvedValue(null);

    const input = {
      userId: 'user-001',
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      targetObjectId: 'obj-billing-header-001',
      mappingResult: {
        generatedMappings: [{ sourceName: 'INVOICE_NUMBER', targetName: 'Invoice_Number__c' }],
        totalRecords: 15,
        successCount: 14,
        failureCount: 1,
      },
      executionResultStatus: 'partial_success',
      errorMessage: '1 out of 15 fields could not be automatically mapped due to incompatible data types',
      ipAddress: '192.168.1.100',
      sessionId: 'session-abc123def456',
      operationExecutedAt: new Date('2026-01-15T10:30:00.000Z'),
    };

    await expect(recordMappingGenerationAuditTrail(input)).rejects.toThrow(AuditTrailPersistenceException);
  });
});
