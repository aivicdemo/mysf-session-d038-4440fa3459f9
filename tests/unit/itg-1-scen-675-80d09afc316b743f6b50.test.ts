import { saveDeal, DataStoreError } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-675: データストアへの保存操作が失敗したとき、DataStoreErrorエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("データストアへの保存操作が失敗したとき、DataStoreErrorエラーが発生する", async () => {
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "550e8400-e29b-41d4-a716-446655440001";
    const stageId = "550e8400-e29b-41d4-a716-446655440002";
    const currentUserId = "550e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2026-10-07T06:22:11.000Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");
    const mockCreateRecord = jest.spyOn(dataStore, "createRecord");

    // Mock: 全ての検証は成功するが、保存が失敗
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "テスト取引先",
          ステータス: "有効",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "営業太郎",
          ステータス: "有効",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "提案段階",
          有効フラグ: true,
        },
      ] as any);

    // Mock: createRecord で DataStoreError をスロー
    mockCreateRecord.mockRejectedValueOnce(
      new DataStoreError("商談の保存に失敗しました。")
    );

    await expect(
      saveDeal({
        dealId: null,
        customerId,
        salesRepresentativeId,
        dealName: "テスト商談",
        dealAmount: 1000000,
        stageId,
        expectedContractDate: "2026-12-31T23:59:59.000Z",
        contractedDate: null,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        currentUserId,
        operationTimestamp,
      })
    ).rejects.toThrow(DataStoreError);
  });
});
