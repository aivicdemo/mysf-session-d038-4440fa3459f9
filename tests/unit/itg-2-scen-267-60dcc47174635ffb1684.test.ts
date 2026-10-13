import { recordMappingGenerationAuditTrail, UserNotAuthenticatedException } from '../../src/logic/audit-trail-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-267: recordMappingGenerationAuditTrail - User Not Authenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotAuthenticatedException when user is not authenticated', async () => {
    const mockUser = {
      userId: null,
      sessionId: null,
      permissions: [],
    };

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockUser);

    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      targetObjectId: '880e8400-e29b-41d4-a716-446655440003',
      mappingResult: {
        mappingTableId: '990e8400-e29b-41d4-a716-446655440004',
        sourceFields: [{ fieldName: 'invoice_number', dataType: 'string' }],
        targetFields: [{ fieldName: 'Invoice_Number__c', dataType: 'Text' }],
        mappings: [{ sourceField: 'invoice_number', targetField: 'Invoice_Number__c', transformationLogic: 'direct_mapping' }],
      },
      executionResultStatus: 'success',
      errorMessage: null,
      ipAddress: '192.168.1.100',
      sessionId: 'sess-550e8400-e29b-41d4-a716-446655440005',
      operationExecutedAt: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(recordMappingGenerationAuditTrail(input)).rejects.toThrow(UserNotAuthenticatedException);
    expect(mappingPersistence.recordOperationAuditTrail).not.toHaveBeenCalled();
  });
});
