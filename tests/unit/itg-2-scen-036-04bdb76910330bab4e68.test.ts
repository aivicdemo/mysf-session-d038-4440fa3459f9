import { generateMappingTable, CalculationLogicDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-036: CalculationLogicDefinitionIncompleteError - Missing logic details', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
      hasPermission: true,
    });

    (projectContextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isValid: true,
    });

    // SCEN-036: 計算ロジック定義が不完全
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'CalculationLogicDefinition') {
        return Promise.resolve([
          {
            logicId: 'calc-001',
            logicType: null,
            targetObject: null,
            logicContent: null,
            dependencies: [],
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  it('should throw CalculationLogicDefinitionIncompleteError when logicType is null', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(
      CalculationLogicDefinitionIncompleteError
    );

    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        '計算ロジック定義が不完全です。既存システムロジックとSalesforceロジックの定義を確認してください。'
      );
    }
  });
});
