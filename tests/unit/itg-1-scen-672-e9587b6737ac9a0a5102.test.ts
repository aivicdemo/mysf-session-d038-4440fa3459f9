import { saveDeal, InvalidDealStage } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-672: 指定された商談ステージIDがマスタに存在しないか有効フラグがfalseのとき、InvalidDealStageエラーが発生する", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("商談ステージの有効フラグがfalseのとき、InvalidDealStageエラーが発生する", async () => {
    const customerId = "550e8400-e29b-41d4-a716-446655440000";
    const salesRepresentativeId = "660e8400-e29b-41d4-a716-446655440001";
    const stageId = "770e8400-e29b-41d4-a716-446655440002";
    const currentUserId = "880e8400-e29b-41d4-a716-446655440003";
    const operationTimestamp = "2025-06-15T10:30:00Z";

    const mockListRecords = jest.spyOn(dataStore, "listRecords");

    // Mock: 取引先存在、営業担当者存在、ステージ無効フラグfalse
    mockListRecords
      .mockResolvedValueOnce([
        {
          取引先ID: customerId,
          取引先名: "テスト取引先",
          取引先名カナ: "テストトリヒキサキ",
          取引先区分: "法人",
          郵便番号: "100-0001",
          住所: "東京都千代田区丸の内",
          電話番号: "03-1234-5678",
          メールアドレス: "contact@test.jp",
          担当者名: "田中太郎",
          支払条件: "月末締め翌月末払い",
          請求先住所: "東京都千代田区丸の内",
          請求先メールアドレス: "invoice@test.jp",
          ステータス: "有効",
          作成日時: "2025-01-01T00:00:00Z",
          更新日時: "2025-06-01T00:00:00Z",
          作成者: "admin",
          更新者: "admin",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          営業担当者ID: salesRepresentativeId,
          名前: "佐藤次郎",
          メールアドレス: "satoh@company.jp",
          電話番号: "090-1234-5678",
          部門: "営業部",
          役職: "営業課長",
          上司ID: "990e8400-e29b-41d4-a716-446655440004",
          ステータス: "有効",
          作成日時: "2025-01-01T00:00:00Z",
          更新日時: "2025-06-01T00:00:00Z",
          作成者: "admin",
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          ステージID: stageId,
          ステージ名: "初期接触",
          ステージ順序: 1,
          説明: "顧客への初期接触段階",
          成約ステージフラグ: false,
          失注ステージフラグ: false,
          有効フラグ: false, // 無効フラグ
          作成日時: "2025-01-01T00:00:00Z",
          更新日時: "2025-06-01T00:00:00Z",
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
        dealAmount: 100000,
        stageId,
        expectedContractDate: "2025-12-31T23:59:59Z",
        contractedDate: null,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        currentUserId,
        operationTimestamp,
      })
    ).rejects.toThrow(InvalidDealStage);
  });
});
