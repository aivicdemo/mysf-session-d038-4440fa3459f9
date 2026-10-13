import { recordMappingGenerationAuditTrail, UserUnauthorizedException } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-268: recordMappingGenerationAuditTrail - User Unauthorized', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserUnauthorizedException when user lacks mapping operation permission', async () => {
    const mockUser = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      isAuthenticated: true,
      sessionId: 'sess-valid-12345',
      permissions: {
        canExecuteMappingOperation: false,
        canViewAuditTrail: true,
      },
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: 'proj-550e8400-e29b-41d4-a716-446655440001',
      targetSystemId: 'sys-550e8400-e29b-41d4-a716-446655440002',
      targetObjectId: 'obj-550e8400-e29b-41d4-a716-446655440003',
      mappingResult: {
        mappingTableId: 'map-550e8400-e29b-41d4-a716-446655440004',
        mappedFields: [
          { sourceField: 'InvoiceNumber', targetField: 'Invoice_Number__c', dataType: 'Text', mappingStatus: 'mapped' },
        ],
        unmappedFields: [],
        generatedAt: '2026-10-07T10:30:00Z',
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-valid-12345',
      operationExecutedAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    await expect(recordMappingGenerationAuditTrail(input)).rejects.toThrow(UserUnauthorizedException);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
