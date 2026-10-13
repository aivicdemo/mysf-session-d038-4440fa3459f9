import { jest } from "@jest/globals";
import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-759: 許容範囲の設定値が存在しない場合、警告メッセージが記録され、デフォルト値が適用される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("許容範囲判定がnullの場合、警告メッセージとともに完全なデータが返される", async () => {
    const discrepancyId = "550e8400-e29b-41d4-a716-446655440000";

    const discrepancyRecord = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      差異ID: "550e8400-e29b-41d4-a716-446655440000",
      旧システム請求書ID: "INV-LEGACY-2024-001",
      新システム請求書ID: "INV-NEW-2024-001",
      差異種類: "金額差異",
      差異内容: "請求金額が一致していない",
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: "2024-01-15T10:30:00Z",
      重大度: "HIGH",
      原因分類: "手数料計算誤差",
      許容範囲判定: null,
      判定日時: null,
      判定者: null,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    };

    const legacyInvoice = {
      id: "INV-LEGACY-2024-001",
      請求書ID: "INV-LEGACY-2024-001",
      ユーザーID: "USER-001",
      請求書番号: "LEGACYINV-20240115-001",
      請求日: "2024-01-10T00:00:00Z",
      請求金額: 100000,
      税金額: 10000,
      ステータス: "issued",
      支払期限日: "2024-02-10T00:00:00Z",
      摘要: "商品販売代金",
      作成日時: "2024-01-10T09:00:00Z",
      更新日時: "2024-01-10T09:00:00Z",
      検証ステータス: "pending",
      検証日時: null,
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-10T09:00:00Z",
    };

    const newInvoice = {
      id: "INV-NEW-2024-001",
      請求書ID: "INV-NEW-2024-001",
      請求書番号: "NEWINV-20240115-001",
      請求日: "2024-01-10T00:00:00Z",
      請求金額: 105000,
      税金額: 10500,
      ステータス: "issued",
      支払期限日: "2024-02-10T00:00:00Z",
      摘要: "商品販売代金",
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-10T09:00:00Z",
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "差異検出結果") {
        return Promise.resolve([discrepancyRecord]);
      }
      if (tableName === "旧システム請求書") {
        return Promise.resolve([legacyInvoice]);
      }
      if (tableName === "新システム請求書") {
        return Promise.resolve([newInvoice]);
      }
      return Promise.resolve([]);
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.discrepancyId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.discrepancyDetection.差異ID).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.discrepancyDetection.差異種類).toBe("金額差異");
    expect(result.discrepancyDetection.金額差異).toBe(5000);
    expect(result.discrepancyDetection.重大度).toBe("HIGH");
    expect(result.discrepancyDetection.原因分類).toBe("手数料計算誤差");
    expect(result.legacySystemInvoice?.請求書ID).toBe("INV-LEGACY-2024-001");
    expect(result.legacySystemInvoice?.請求書番号).toBe("LEGACYINV-20240115-001");
    expect(result.legacySystemInvoice?.請求金額).toBe(100000);
    expect(result.newSystemInvoice?.請求書ID).toBe("INV-NEW-2024-001");
    expect(result.newSystemInvoice?.請求書番号).toBe("NEWINV-20240115-001");
    expect(result.newSystemInvoice?.請求金額).toBe(105000);
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
    expect(result.warningMessage).toBe("許容範囲設定値が存在しません。デフォルト値を適用します。");
  });
});
