import { saveDeal, CustomerNotFound } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-670: 指定された取引先IDがテーブルに存在しないとき、CustomerNotFoundエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("取引先IDがテーブルに存在しないとき、CustomerNotFoundエラーが発生する", async () => {
    const customerId = "00000000-0000-0000-0000-000000000001";
    const salesRepresentativeId = "00000000-0000-0000-0000-000000000101";
    const stageId = "00000000-0000-0000-0000-000000000201";
    const currentUserId = "00000000-0000-0000-0000-000000000301";
    const operationTimestamp = "2026-10-07T06:22:11.338Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");

    // Mock: 取引先テーブルが空（存在しない）、営業担当者とステージは存在
    mockListRecords
      .mockResolvedValueOnce([]) // 取引先テーブル: 空
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "営業太郎",
          メールアドレス: "sales@example.com",
          電話番号: "090-0000-0001",
          部門: "営業部",
          役職: "課長",
          上司ID: null,
          ステータス: "active",
          作成日時: "2026-01-01T00:00:00Z",
          更新日時: "2026-01-01T00:00:00Z",
          作成者: "admin",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "提案中",
          ステージ順序: 2,
          説明: "顧客への提案段階",
          成約ステージフラグ: false,
          失注ステージフラグ: false,
          有効フラグ: true,
          作成日時: "2026-01-01T00:00:00Z",
          更新日時: "2026-01-01T00:00:00Z",
          作成者: "admin",
          更新者: "admin",
        },
      ] as any);

    await expect(
      saveDeal({
        dealId: null,
        customerId,
        salesRepresentativeId,
        dealName: "テスト商談",
        dealAmount: 1000000,
        stageId,
        expectedContractDate: "2026-12-31T23:59:59Z",
        contractedDate: null,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        currentUserId,
        operationTimestamp,
      })
    ).rejects.toThrow(CustomerNotFound);
  });
});
