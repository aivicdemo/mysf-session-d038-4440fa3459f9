import { queryMappingTableForDisplay, DataRetrievalError } from "../../src/logic/mapping-query-service";
import * as mappingAuth from "../../src/logic/authentication-authorization";
import * as projectResolver from "../../src/logic/project-context-resolver";
import * as mappingPersistence from "../../src/logic/mapping-persistence";

jest.mock("../../src/logic/authentication-authorization");
jest.mock("../../src/logic/project-context-resolver");
jest.mock("../../src/logic/mapping-persistence");

describe("SCEN-234: queryMappingTableForDisplay with data retrieval failure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw DataRetrievalError when mapping details retrieval fails", async () => {
    const input = {
      userId: "user-001",
      projectId: "project-123",
      targetSystemId: "system-456",
    };

    const mockAuthResult = {
      isAuthorized: true,
      userId: "user-001",
      operationType: "read_mapping",
      projectId: "project-123",
    };

    const mockProjectContext = {
      projectId: "project-123",
      targetSystemId: "system-456",
      userId: "user-001",
      userRole: "admin",
      isContextValid: true,
    };

    (mappingAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockRejectedValue(
      new DataRetrievalError("マッピング表データの取得に失敗しました。")
    );

    await expect(queryMappingTableForDisplay(input)).rejects.toThrow(DataRetrievalError);
    await expect(queryMappingTableForDisplay(input)).rejects.toThrow(
      "マッピング表データの取得に失敗しました。"
    );
  });
});
