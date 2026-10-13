import { generateMappingTable, MappingGenerationFailedError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-040: MappingGenerationFailedError - System error during generation', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
    });

    (projectContextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
    });

    // SCEN-040: analyzeCalculationLogicDependencies 呼び出し中にシステムエラーが発生
    (dataStore.listRecords as jest.Mock).mockImplementation(() => {
      return Promise.reject(new Error('System error during processing'));
    });
  });

  it('should throw MappingGenerationFailedError when system error occurs during mapping generation', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(MappingGenerationFailedError);

    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        '機能マッピング表の生成に失敗しました。システム管理者に連絡してください。'
      );
    }
  });
});
