import { searchMappingsByCondition } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn(),
  retrieveMappingValidationResultsForProject: jest.fn(),
  retrieveMigrationRiskAssessmentsForProject: jest.fn(),
}));

jest.mock('../../src/platform/data-store');

describe('SCEN-257: 検索結果が0件の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
    });

    (projectModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'project-migration-001',
      targetSystemId: 'target-system-oracle-001',
      isValid: true,
    });

    (persistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue([]);
    (persistenceModule.retrieveMappingValidationResultsForProject as jest.Mock).mockResolvedValue([]);
    (persistenceModule.retrieveMigrationRiskAssessmentsForProject as jest.Mock).mockResolvedValue([]);
  });

  test('検索結果が0件の場合、マッピングテーブル行が空配列で、全件数と件数0で返される', async () => {
    const input = {
      userId: 'user-001',
      projectId: 'project-migration-001',
      targetSystemId: 'target-system-oracle-001',
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await searchMappingsByCondition(input);

    expect(result.mappingTableRows).toEqual([]);
    expect(result.totalRowCount).toBe(0);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.filteredRowCount).toBe(0);
  });
});
