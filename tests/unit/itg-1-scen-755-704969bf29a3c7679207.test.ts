import { saveSalesRepresentative } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import type { SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-755: saveSalesRepresentative - Update with valid supervisor ID", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully create new sales representative when supervisor exists in database", async () => {
    const generatedId = "uuid-new-001";
    const supervisorRecord = {
      id: "supervisor-001",
      営業担当者ID: "supervisor-001",
      名前: "山田太郎",
      メールアドレス: "yamada@company.com",
      電話番号: "09012345678",
      部門: "営業部",
      役職: "部長",
      上司ID: null,
      ステータス: "有効",
    };

    const mockOutput: SaveSalesRepresentativeOutput = {
      salesRepresentativeId: generatedId,
      name: "佐藤次郎",
      emailAddress: "satoh@company.com",
      phoneNumber: "09087654321",
      department: "営業部",
      jobTitle: "営業課長",
      supervisorId: "supervisor-001",
      status: "有効",
      createdAt: "2026-10-07T10:30:00Z",
      updatedAt: "2026-10-07T10:30:00Z",
      createdBy: "user-123",
      updatedBy: null,
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([supervisorRecord]);
    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: generatedId,
      ...mockOutput,
    });

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: "佐藤次郎",
      emailAddress: "satoh@company.com",
      phoneNumber: "09087654321",
      department: "営業部",
      jobTitle: "営業課長",
      supervisorId: "supervisor-001",
      status: "有効",
      currentUserId: "user-123",
      operationTimestamp: "2026-10-07T10:30:00Z",
    };

    const result = await saveSalesRepresentative(input);

    expect(result.salesRepresentativeId).not.toBeNull();
    expect(result.name).toBe("佐藤次郎");
    expect(result.emailAddress).toBe("satoh@company.com");
    expect(result.phoneNumber).toBe("09087654321");
    expect(result.department).toBe("営業部");
    expect(result.jobTitle).toBe("営業課長");
    expect(result.supervisorId).toBe("supervisor-001");
    expect(result.status).toBe("有効");
    expect(result.createdAt).toBe("2026-10-07T10:30:00Z");
    expect(result.updatedAt).toBe("2026-10-07T10:30:00Z");
    expect(result.createdBy).toBe("user-123");
    expect(result.updatedBy).toBeNull();

    expect(dataStore.listRecords).toHaveBeenCalledWith("営業担当者");
    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
