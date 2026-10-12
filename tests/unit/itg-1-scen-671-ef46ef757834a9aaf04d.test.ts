import { saveDeal, SalesRepresentativeNotFound } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-671: 指定された営業担当者IDがテーブルに存在しないとき、SalesRepresentativeNotFoundエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("営業担当者IDがテーブルに存在しないとき、SalesRepresentativeNotFoundエラーが発生する", async () => {
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "660e8400-e29b-41d4-a716-446655440001";
    const stageId = "770e8400-e29b-41d4-a716-446655440002";
    const currentUserId = "880e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2026-10-07T06:22:11.338Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");

    // Mock: 取引先存在、営業担当者テーブル空、ステージ存在
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "テスト取引先",
          取引先名カナ: "テストトリヒキサキ",
          取引先区分: "顧客",
          郵便番号: "100-0001",
          住所: "東京都千代田区丸の内1-1-1",
          電話番号: "03-XXXX-XXXX",
          メールアドレス: "contact@test-customer.jp",
          担当者名: "山田太郎",
          支払条件: "月末締め翌月末払い",
          請求先住所: "東京都千代田区丸の内1-1-1",
          請求先メールアドレス: "billing@test-customer.jp",
          ステータス: "有効",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          作成者: "admin",
          更新者: "admin",
        },
      ] as any)
      .mockResolvedValueOnce([]) // 営業担当者テーブル: 空
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "初期接触",
          ステージ順序: 1,
          説明: "顧客との初期接触段階",
          成約ステージフラグ: false,
          失注ステージフラグ: false,
          有効フラグ: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
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
    ).rejects.toThrow(SalesRepresentativeNotFound);
  });
});
