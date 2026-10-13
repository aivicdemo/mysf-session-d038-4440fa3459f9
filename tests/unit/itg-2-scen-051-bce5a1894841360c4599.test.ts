import { generateMappingTable, SalesforceObjectDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-generation-service';

describe('SCEN-051: 設計済みエラー系：generateFeatureMappingTable実行時にSalesforceオブジェクト定義が空または不完全な場合、業務ルール制約エラーとしてTargetSystemNotFoundErrorではなく適切な定義不完全エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Salesforceオブジェクト定義が空の場合、SalesforceObjectDefinitionIncompleteError が発生する', async () => {
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
        executionTimestamp: 1700000000000,
      })
    ).rejects.toThrow(SalesforceObjectDefinitionIncompleteError);
  });

  it('エラーメッセージが「Salesforceオブジェクト定義が不完全です。請求書・請求明細の構造定義を確認してください。」である', async () => {
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
        executionTimestamp: 1700000000000,
      });
      fail('Should have thrown SalesforceObjectDefinitionIncompleteError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(SalesforceObjectDefinitionIncompleteError);
      expect(error.message).toContain('Salesforceオブジェクト定義が不完全です');
    }
  });
});
