import { generateMappingTable, StandardFunctionDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-generation-service';
import * as validationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

describe('SCEN-048: 業務ルール制約2（br-tx_10-006）：移行対象システムの標準機能情報が提供されていない場合、エラーメッセージ「移行対象システムの機能仕様を確認してから実行してください」で処理が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matchStandardFunctions が null を返した場合、StandardFunctionDefinitionIncompleteError がスロー（throw）される', async () => {
    const mockVerifyUserAuthenticationAndAuthorization = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'generateMappingTable',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const mockResolveProjectContext = jest.fn().mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      userRole: 'analyst',
      isContextValid: true,
    });

    jest.spyOn(authModule, 'verifyUserAuthenticationAndAuthorization').mockImplementation(mockVerifyUserAuthenticationAndAuthorization);
    jest.spyOn(contextModule, 'resolveProjectContext').mockImplementation(mockResolveProjectContext);

    await expect(
      generateMappingTable({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '770e8400-e29b-41d4-a716-446655440002',
        executionTimestamp: 1672531200000,
      })
    ).rejects.toThrow(StandardFunctionDefinitionIncompleteError);
  });

  it('StandardFunctionDefinitionIncompleteError には「移行対象システムの標準機能定義が不完全です。システムの標準機能を確認してください。」というメッセージが含まれる', async () => {
    const mockVerifyUserAuthenticationAndAuthorization = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: '770e8400-e29b-41d4-a716-446655440002',
      operationType: 'generateMappingTable',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const mockResolveProjectContext = jest.fn().mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '770e8400-e29b-41d4-a716-446655440002',
      userRole: 'analyst',
      isContextValid: true,
    });

    jest.spyOn(authModule, 'verifyUserAuthenticationAndAuthorization').mockImplementation(mockVerifyUserAuthenticationAndAuthorization);
    jest.spyOn(contextModule, 'resolveProjectContext').mockImplementation(mockResolveProjectContext);

    try {
      await generateMappingTable({
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        targetSystemId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '770e8400-e29b-41d4-a716-446655440002',
        executionTimestamp: 1672531200000,
      });
      fail('Should have thrown StandardFunctionDefinitionIncompleteError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(StandardFunctionDefinitionIncompleteError);
      expect(error.message).toContain('移行対象システムの標準機能定義が不完全です');
    }
  });
});
