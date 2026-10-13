import { jest } from "@jest/globals";
import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-761: 新システムのデータが空の場合、エラーメッセージが返され分類・優先度付けが中止される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("新システム請求書データが見つからない場合、NewInvoiceNotFoundErrorが発生する", async () => {
    const discrepancyId = "550e8400-e29b-41d4-a716-446655440000";

    const discrepancyRecord = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      差異ID: "550e8400-e29b-41d4-a716-446655440000",
      旧システム請求書ID: "LEGACY-INV-001",
      新システム請求書ID: "NEW-INV-001",
      差異種類: "金額差異",
      差異内容: "請求金額が一致しない",
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: "2026-01-15T10:30:00Z",
      重大度: "HIGH",
      原因分類: "税金計算誤り",
      許容範囲判定: "超過",
      判定日時: "2026-01-15T11:00:00Z",
      判定者: "user-uuid-001",
    };

    const legacyInvoice = {
      id: "LEGACY-INV-001",
      請求書ID: "LEGACY-INV-001",
      ユーザーID: "user-123",
      請求書番号: "LEG-2026-001",
      請求日: "2026-01-10T00:00:00Z",
      請求金額: 100000,
      税金額: 10000,
      ステータス: "確定",
      支払期限日: "2026-02-10T00:00:00Z",
      摘要: "月次請求",
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "差異検出結果") {
        return Promise.resolve([discrepancyRecord]);
      }
      if (tableName === "旧システム請求書") {
        return Promise.resolve([legacyInvoice]);
      }
      if (tableName === "新システム請求書") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(NewInvoiceNotFoundError);
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow("新システム請求書データが見つかりません。");
  });
});
