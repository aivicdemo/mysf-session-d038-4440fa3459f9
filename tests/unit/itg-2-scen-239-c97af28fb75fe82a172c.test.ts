import {
  searchMappingsByCondition,
  NoMatchingMappingsError,
} from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-239: NoMatchingMappingsError when no mapping matches search condition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoMatchingMappingsError when search condition matches no mappings', async () => {
    const mockAuthModule = jest.mocked(authModule);
    const mockProjectModule = jest.mocked(projectModule);
    const mockPersistenceModule = jest.mocked(persistenceModule);

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      operationType: 'search_mapping',
      projectId: 'proj-migration-2026',
    });

    mockProjectModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-2026',
      targetSystemId: 'target-oracle-erp',
    });

    mockPersistenceModule.retrieveMappingDetailsForProject.mockResolvedValue([]);
    mockPersistenceModule.retrieveMappingValidationResultsForProject.mockResolvedValue([]);
    mockPersistenceModule.retrieveMigrationRiskAssessmentsForProject.mockResolvedValue([]);

    const input = {
      userId: 'user-001',
      projectId: 'proj-migration-2026',
      targetSystemId: 'target-oracle-erp',
      existingFunctionName: '請求書承認フロー',
      pageNumber: 1,
      pageSize: 20,
    };

    await expect(searchMappingsByCondition(input)).rejects.toThrow(NoMatchingMappingsError);
    await expect(searchMappingsByCondition(input)).rejects.toThrow(
      '検索条件にマッチする機能マッピングが見つかりません。'
    );
  });
});
