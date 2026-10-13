import { recordMappingGenerationAuditTrail, InvalidMappingGenerationInputException } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-270: recordMappingGenerationAuditTrail - Invalid Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidMappingGenerationInputException when input data is invalid', async () => {
    const mockUser = {
      isAuthenticated: true,
      userId: '550e8400-e29b-41d4-a716-446655440000',
      hasPermission: true,
    };

    const mockProjectContext = {
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440002',
      isResolved: true,
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);
    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440002',
      targetObjectId: '',
      mappingResult: null,
      executionResultStatus: 'invalid_status',
      errorMessage: null,
      ipAddress: '192.0.2.1',
      sessionId: 'session-550e8400-e29b-41d4-a716-446655440003',
      operationExecutedAt: new Date('2026-01-15T10:30:00.000Z'),
    };

    await expect(recordMappingGenerationAuditTrail(input)).rejects.toThrow(InvalidMappingGenerationInputException);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
