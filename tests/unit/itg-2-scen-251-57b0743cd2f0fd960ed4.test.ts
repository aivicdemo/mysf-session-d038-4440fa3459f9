import { searchMappingsByCondition, InvalidSearchConditionError } from "../../src/logic/mapping-query-service";
import * as authorizationService from "../../src/logic/authentication-authorization";
import * as projectContextResolver from "../../src/logic/project-context-resolver";

jest.mock("../../src/logic/mapping-persistence", () => ({
  ...jest.requireActual<typeof import("../../src/logic/mapping-persistence")>("../../src/logic/mapping-persistence"),
}));

jest.mock("../../src/logic/authentication-authorization", () => ({
  ...jest.requireActual<typeof import("../../src/logic/authentication-authorization")>("../../src/logic/authentication-authorization"),
}));

jest.mock("../../src/logic/project-context-resolver", () => ({
  ...jest.requireActual<typeof import("../../src/logic/project-context-resolver")>("../../src/logic/project-context-resolver"),
}));

describe("SCEN-251: ページサイズが0以下の無効な値の場合、InvalidSearchConditionErrorが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw InvalidSearchConditionError when pageSize is 0", async () => {
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasProjectAccess: true,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: "proj-001",
      targetSystemId: "target-001",
      isValid: true,
    });

    await expect(
      searchMappingsByCondition({
        userId: "user-001",
        projectId: "proj-001",
        targetSystemId: "target-001",
        pageSize: 0,
      })
    ).rejects.toThrow(InvalidSearchConditionError);

    await expect(
      searchMappingsByCondition({
        userId: "user-001",
        projectId: "proj-001",
        targetSystemId: "target-001",
        pageSize: 0,
      })
    ).rejects.toThrow("検索条件の値が無効です。");
  });
});
