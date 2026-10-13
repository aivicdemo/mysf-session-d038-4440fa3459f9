import { generateMappingTable, MappingGenerationFailedError } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-043: 移行対象システムの標準機能定義が未提供の場合のエラーハンドリング', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(true);
    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isValid: true,
      userHasAccess: true,
    });
  });

  test('matchStandardFunctions が null を返す場合、MappingGenerationFailedError が throw される', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(MappingGenerationFailedError);
  });

  test('エラーメッセージが「移行対象システムの標準機能・API仕様が未確認です。パートナーから仕様書を取得してください」である', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    try {
      await generateMappingTable(input);
      fail('MappingGenerationFailedError が throw されるべき');
    } catch (error) {
      expect(error).toBeInstanceOf(MappingGenerationFailedError);
      expect((error as Error).message).toBe('移行対象システムの標準機能・API仕様が未確認です。パートナーから仕様書を取得してください');
    }
  });

  test('出力が生成されない（throw される）', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    const result = generateMappingTable(input);
    await expect(result).rejects.toThrow();
  });
});
