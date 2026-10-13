import { aggregateMappingStatistics, ProjectContextNotFoundError } from "../../src/logic/mapping-query-service";
import * as authModule from "../../src/logic/authentication-authorization";
import * as projectContextModule from "../../src/logic/project-context-resolver";
import * as mappingPersistenceModule from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-261: aggregateMappingStatistics - Project Context Not Found", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ProjectContextNotFoundError when project/target system does not exist", async () => {
    const userId = "user-123";
    const projectId = "proj-999";
    const targetSystemId = "sys-invalid";

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
      hasAccessToProject: true,
      hasAccessToTargetSystem: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockRejectedValue(
      new ProjectContextNotFoundError("指定されたプロジェクト・移行対象システムが見つかりません。")
    );

    await expect(
      aggregateMappingStatistics({
        userId,
        projectId,
        targetSystemId,
      })
    ).rejects.toThrow(ProjectContextNotFoundError);

    await expect(
      aggregateMappingStatistics({
        userId,
        projectId,
        targetSystemId,
      })
    ).rejects.toThrow("指定されたプロジェクト・移行対象システムが見つかりません。");

    expect(mappingPersistenceModule.retrieveMappingDetailsForProject).not.toHaveBeenCalled();
    expect(mappingPersistenceModule.retrieveMappingValidationResultsForProject).not.toHaveBeenCalled();
    expect(mappingPersistenceModule.retrieveMigrationRiskAssessmentsForProject).not.toHaveBeenCalled();
  });
});
