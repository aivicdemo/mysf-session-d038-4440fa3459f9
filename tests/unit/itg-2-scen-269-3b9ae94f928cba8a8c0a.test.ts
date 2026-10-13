import { recordMappingGenerationAuditTrail, ProjectContextNotResolvedException } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-269: recordMappingGenerationAuditTrail - Project Context Not Resolved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextNotResolvedException when project context cannot be resolved', async () => {
    const mockUser = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      isAuthenticated: true,
      hasPermission: true,
      permissions: ['mapping_generation', 'audit_trail_recording'],
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      targetObjectId: '880e8400-e29b-41d4-a716-446655440003',
      mappingResult: {
        mappingId: '990e8400-e29b-41d4-a716-446655440004',
        mappedFields: [{ sourceField: 'invoice_id', targetField: 'Invoice_Number__c', mappingStatus: 'mapped' }],
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440000',
      operationExecutedAt: new Date('2026-01-15T10:30:00.000Z'),
    };

    await expect(recordMappingGenerationAuditTrail(input)).rejects.toThrow(ProjectContextNotResolvedException);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
