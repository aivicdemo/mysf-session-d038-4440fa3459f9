import { saveDeal, ContractedDateAfterExpectedDate } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-674: 成約日が成約予定日より後のとき、ContractedDateAfterExpectedDateエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("成約日が成約予定日より後のとき、ContractedDateAfterExpectedDateエラーが発生する", async () => {
    const dealId = null;
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";
    const stageId = "550e8400-e29b-41d4-a716-446655440002";
    const currentUserId = "550e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2024-01-20T10:00:00Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");

    // Mock: 全項目が有効
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "テスト取引先",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "営業太郎",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "成約",
          有効フラグ: true,
        },
      ] as any);

    await expect(
      saveDeal({
        dealId,
        customerId,
        salesRepresentativeId,
        dealName: "テスト商談",
        dealAmount: 1000000,
        stageId,
        expectedContractDate: "2024-01-15", // 成約予定日
        contractedDate: "2024-01-20", // 成約日が後
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        currentUserId,
        operationTimestamp,
      })
    ).rejects.toThrow(ContractedDateAfterExpectedDate);
  });
});
