import { searchMappingsByCondition, InvalidSearchConditionError } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/platform/data-store');

describe('SCEN-253: ギャップ分類が定義済みの値以外の無効な値の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
    });

    (projectModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemId: 'oracle-billing-001',
      isValid: true,
    });
  });

  test('InvalidSearchConditionError が発生し、エラー文言が返される', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-001',
      targetSystemId: 'oracle-billing-001',
      gapClassification: '無効な値',
    };

    await expect(searchMappingsByCondition(input)).rejects.toThrow(InvalidSearchConditionError);
    await expect(searchMappingsByCondition(input)).rejects.toThrow('検索条件の値が無効です。');
  });
});
