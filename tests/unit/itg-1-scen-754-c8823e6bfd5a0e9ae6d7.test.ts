import { saveSalesRepresentative } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import type { SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-754: saveSalesRepresentative - New creation with null supervisor ID", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully create new sales representative with null supervisor ID", async () => {
    const generatedId = "uuid-1234-5678-9012";
    const mockOutput: SaveSalesRepresentativeOutput = {
      salesRepresentativeId: generatedId,
      name: "山田太郎",
      emailAddress: "yamada.taro@example.com",
      phoneNumber: null,
      department: "営業部",
      jobTitle: null,
      supervisorId: null,
      status: null,
      createdAt: "2026-10-07T12:30:45.000Z",
      updatedAt: "2026-10-07T12:30:45.000Z",
      createdBy: "user-001",
      updatedBy: null,
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);
    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: generatedId,
      ...mockOutput,
    });

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: "山田太郎",
      emailAddress: "yamada.taro@example.com",
      phoneNumber: null,
      department: "営業部",
      jobTitle: null,
      supervisorId: null,
      status: null,
      currentUserId: "user-001",
      operationTimestamp: "2026-10-07T12:30:45.000Z",
    };

    const result = await saveSalesRepresentative(input);

    expect(result.salesRepresentativeId).not.toBeNull();
    expect(result.name).toBe("山田太郎");
    expect(result.emailAddress).toBe("yamada.taro@example.com");
    expect(result.phoneNumber).toBeNull();
    expect(result.department).toBe("営業部");
    expect(result.jobTitle).toBeNull();
    expect(result.supervisorId).toBeNull();
    expect(result.status).toBeNull();
    expect(result.createdAt).toBe("2026-10-07T12:30:45.000Z");
    expect(result.updatedAt).toBe("2026-10-07T12:30:45.000Z");
    expect(result.createdBy).toBe("user-001");
    expect(result.updatedBy).toBeNull();

    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
