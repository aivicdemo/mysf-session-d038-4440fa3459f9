import { queryMappingTableForDisplay, ProjectContextNotFoundError } from "../../src/logic/mapping-query-service";
import * as mappingAuth from "../../src/logic/authentication-authorization";
import * as projectResolver from "../../src/logic/project-context-resolver";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-233: queryMappingTableForDisplay with nonexistent or invalid project/system", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ProjectContextNotFoundError when project or system does not exist or is invalid", async () => {
    const input = {
      userId: "user-001",
      projectId: "proj-nonexistent",
      targetSystemId: "sys-invalid",
    };

    const mockAuthResult = {
      isAuthorized: true,
      userId: "user-001",
      operationType: "read_mapping",
      projectId: "proj-nonexistent",
    };

    (mappingAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (projectResolver.resolveProjectContext as jest.Mock).mockRejectedValue(
      new ProjectContextNotFoundError("指定されたプロジェクトまたは移行対象システムが見つかりません。")
    );

    await expect(queryMappingTableForDisplay(input)).rejects.toThrow(ProjectContextNotFoundError);
    await expect(queryMappingTableForDisplay(input)).rejects.toThrow(
      "指定されたプロジェクトまたは移行対象システムが見つかりません。"
    );
  });
});
