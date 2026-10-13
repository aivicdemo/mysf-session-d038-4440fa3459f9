import { searchMappingsByCondition, UnauthorizedAccessError } from "../../src/logic/mapping-query-service";
import * as mappingAuth from "../../src/logic/authentication-authorization";
import * as projectResolver from "../../src/logic/project-context-resolver";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-236: searchMappingsByCondition with unauthorized user", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw UnauthorizedAccessError when user is not authenticated or lacks project access", async () => {
    const input = {
      userId: "user-123",
      projectId: "proj-456",
      targetSystemId: "target-789",
      existingFunctionName: undefined,
      mappingStatus: undefined,
      gapClassification: undefined,
      riskLevel: undefined,
      complexity: undefined,
      validationStatus: undefined,
      priority: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    const mockAuthResult = {
      isAuthorized: false,
      userId: "user-123",
      operationType: "search_mapping",
      projectId: "proj-456",
      denialReason: "User is not authenticated or lacks project access",
    };

    (mappingAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);

    await expect(searchMappingsByCondition(input)).rejects.toThrow(UnauthorizedAccessError);
    await expect(searchMappingsByCondition(input)).rejects.toThrow(
      "ユーザーは認証されていないか、このプロジェクトへのアクセス権がありません。"
    );
  });
});
