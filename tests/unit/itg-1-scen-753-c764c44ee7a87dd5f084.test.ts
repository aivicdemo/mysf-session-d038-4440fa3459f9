import { saveSalesRepresentative, DataPersistenceFailure } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import type { SaveSalesRepresentativeInput, SaveSalesRepresentativeOutput } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store");

describe("SCEN-753: saveSalesRepresentative - Database save operation failure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw DataPersistenceFailure when data store fails", async () => {
    const mockDataStoreError = new Error("Database connection failed");
    (dataStore.createRecord as jest.Mock).mockRejectedValue(mockDataStoreError);

    const input: SaveSalesRepresentativeInput = {
      salesRepresentativeId: null,
      name: "山田太郎",
      emailAddress: "yamada.taro@example.com",
      department: "営業部",
      phoneNumber: null,
      jobTitle: null,
      supervisorId: null,
      status: null,
      currentUserId: "user-001",
      operationTimestamp: "2025-01-15T10:30:00Z",
    };

    await expect(saveSalesRepresentative(input)).rejects.toThrow(DataPersistenceFailure);
    await expect(saveSalesRepresentative(input)).rejects.toThrow(
      "営業担当者情報の保存に失敗しました。システム管理者に連絡してください。"
    );
  });
});
