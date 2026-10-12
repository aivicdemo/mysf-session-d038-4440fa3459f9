import { saveDeal, DealAmountInvalid } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-673: 商談金額が0以下のとき、DealAmountInvalidエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("商談金額が0のとき、DealAmountInvalidエラーが発生する", async () => {
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "660e8400-e29b-41d4-a716-446655440001";
    const stageId = "770e8400-e29b-41d4-a716-446655440002";
    const currentUserId = "880e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2024-01-15T10:30:00Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");

    // Mock: 取引先存在、営業担当者存在、ステージ有効
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: customerId,
          取引先名: "顧客A",
          取引先名カナ: "コキャクエー",
          取引先区分: "新規",
          郵便番号: "100-0001",
          住所: "東京都千代田区丸の内1-1-1",
          電話番号: "03-1234-5678",
          メールアドレス: "customer@example.com",
          担当者名: "山田太郎",
          支払条件: "月末締め翌月末払い",
          請求先住所: "東京都千代田区丸の内1-1-1",
          請求先メールアドレス: "billing@example.com",
          ステータス: "アクティブ",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: salesRepresentativeId,
          名前: "鈴木営太",
          メールアドレス: "suzuki@company.com",
          電話番号: "090-1111-2222",
          部門: "営業部",
          役職: "課長",
          上司ID: "990e8400-e29b-41d4-a716-446655440004",
          ステータス: "在職",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: stageId,
          ステージ名: "初期接触",
          ステージ順序: 1,
          説明: "顧客との初期接触段階",
          成約ステージフラグ: false,
          失注ステージフラグ: false,
          有効フラグ: true,
        },
      ] as any);

    await expect(
      saveDeal({
        dealId: null,
        customerId,
        salesRepresentativeId,
        dealName: "テスト商談",
        dealAmount: 0, // 無効な金額
        stageId,
        expectedContractDate: "2024-12-31T23:59:59Z",
        contractedDate: null,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        currentUserId,
        operationTimestamp,
      })
    ).rejects.toThrow(DealAmountInvalid);
  });
});
