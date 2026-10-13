import { aggregateMappingStatistics, DataRetrievalError } from "../../src/logic/mapping-query-service";
import * as authModule from "../../src/logic/authentication-authorization";
import * as projectContextModule from "../../src/logic/project-context-resolver";
import * as mappingPersistenceModule from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-262: aggregateMappingStatistics - Data Retrieval Error", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw DataRetrievalError when mapping details retrieval fails", async () => {
    const userId = "user-001";
    const projectId = "proj-001";
    const targetSystemId = "sys-oracle-001";

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
      hasAccessToProject: true,
      hasAccessToTargetSystem: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      projectExists: true,
      targetSystemExists: true,
      isValid: true,
    });

    (mappingPersistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockRejectedValue(
      new DataRetrievalError("統計情報の集計に必要なデータの取得に失敗しました。")
    );

    await expect(
      aggregateMappingStatistics({
        userId,
        projectId,
        targetSystemId,
      })
    ).rejects.toThrow(DataRetrievalError);

    await expect(
      aggregateMappingStatistics({
        userId,
        projectId,
        targetSystemId,
      })
    ).rejects.toThrow("統計情報の集計に必要なデータの取得に失敗しました。");
  });
});
