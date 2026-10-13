import { aggregateMappingStatistics, UnauthorizedAccessError } from "../../src/logic/mapping-query-service";
import * as authModule from "../../src/logic/authentication-authorization";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-260: aggregateMappingStatistics - Unauthorized Access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw UnauthorizedAccessError when user lacks access to project and target system", async () => {
    const userId = "user-without-access";
    const projectId = "project-001";
    const targetSystemId = "system-oracle-billing";

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new UnauthorizedAccessError("指定されたプロジェクト・移行対象システムへのアクセス権がありません。")
    );

    const error = new UnauthorizedAccessError("指定されたプロジェクト・移行対象システムへのアクセス権がありません。");
    await expect(
      aggregateMappingStatistics({
        userId,
        projectId,
        targetSystemId,
      })
    ).rejects.toThrow(error.message);
  });
});
