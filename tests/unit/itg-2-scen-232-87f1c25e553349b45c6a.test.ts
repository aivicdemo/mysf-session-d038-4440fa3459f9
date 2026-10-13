import { queryMappingTableForDisplay, UnauthorizedAccessError } from "../../src/logic/mapping-query-service";
import * as mappingAuth from "../../src/logic/authentication-authorization";
import * as projectResolver from "../../src/logic/project-context-resolver";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-232: queryMappingTableForDisplay with unauthenticated or unauthorized user", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw UnauthorizedAccessError when user is not authenticated or lacks project access", async () => {
    const input = {
      userId: "user-123",
      projectId: "project-456",
      targetSystemId: "system-789",
    };

    const mockAuthResult = {
      isAuthorized: false,
      userId: "user-123",
      operationType: "read_mapping",
      projectId: "project-456",
      denialReason: "User is not authenticated or lacks project access",
    };

    (mappingAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);

    await expect(queryMappingTableForDisplay(input)).rejects.toThrow(UnauthorizedAccessError);
    await expect(queryMappingTableForDisplay(input)).rejects.toThrow(
      "このプロジェクトへのアクセス権がありません。"
    );
  });
});
