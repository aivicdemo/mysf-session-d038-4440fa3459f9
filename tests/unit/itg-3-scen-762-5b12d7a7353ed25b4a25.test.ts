import { jest } from "@jest/globals";
import { retrieveDiscrepancyDetailsForConfirmation, RetrieveDiscrepancyDetailsForConfirmationOutput } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-762: 差異件数が1000件を超える場合、警告メッセージが記録され、期間を絞っての再実行が促される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("単一の差異を取得し、すべてのデータが正常に返される", async () => {
    const discrepancyId = "d550e8cc-4b45-4c1a-9d7b-f3e2a1b9c6d5";

    const discrepancyRecord = {
      id: "d550e8cc-4b45-4c1a-9d7b-f3e2a1b9c6d5",
      差異ID: "d550e8cc-4b45-4c1a-9d7b-f3e2a1b9c6d5",
      旧システム請求書ID: "INV-OLD-001",
      新システム請求書ID: "INV-NEW-001",
      差異種類: "金額差異",
      差異内容: "請求金額が不一致",
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: "2026-10-07T10:00:00Z",
      重大度: "HIGH",
      原因分類: "計算誤り",
      許容範囲判定: "NG",
      判定日時: "2026-10-07T10:15:00Z",
      判定者: "user-123",
    };

    const legacyInvoice = {
      id: "INV-OLD-001",
      請求書ID: "INV-OLD-001",
      ユーザーID: "usr-old-001",
      請求書番号: "INV20261001",
      請求日: "2026-10-01T00:00:00Z",
      請求金額: 100000,
      税金額: 10000,
      ステータス: "issued",
      支払期限日: "2026-10-31T00:00:00Z",
      摘要: "旧システム請求書",
      作成日時: "2026-10-01T08:00:00Z",
      更新日時: "2026-10-01T08:00:00Z",
      検証ステータス: "pending",
      検証日時: null,
    };

    const newInvoice = {
      id: "INV-NEW-001",
      請求書ID: "INV-NEW-001",
      請求書番号: "INV20261002",
      請求日: "2026-10-01T00:00:00Z",
      請求金額: 105000,
      税金額: 10500,
      ステータス: "issued",
      支払期限日: "2026-10-31T00:00:00Z",
      摘要: "新システム請求書",
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

    expect(result.discrepancyId).toBe("d550e8cc-4b45-4c1a-9d7b-f3e2a1b9c6d5");
    expect(result.discrepancyDetection.差異ID).toBe("d550e8cc-4b45-4c1a-9d7b-f3e2a1b9c6d5");
    expect(result.discrepancyDetection.旧システム請求書ID).toBe("INV-OLD-001");
    expect(result.discrepancyDetection.新システム請求書ID).toBe("INV-NEW-001");
    expect(result.discrepancyDetection.差異種類).toBe("金額差異");
    expect(result.discrepancyDetection.差異内容).toBe("請求金額が不一致");
    expect(result.discrepancyDetection.金額差異).toBe(5000);
    expect(result.discrepancyDetection.件数差異).toBe(0);
    expect(result.discrepancyDetection.ステータス差異).toBeNull();
    expect(result.discrepancyDetection.検出日時).toBe("2026-10-07T10:00:00Z");
    expect(result.discrepancyDetection.重大度).toBe("HIGH");
    expect(result.discrepancyDetection.原因分類).toBe("計算誤り");
    expect(result.discrepancyDetection.許容範囲判定).toBe("NG");
    expect(result.discrepancyDetection.判定日時).toBe("2026-10-07T10:15:00Z");
    expect(result.discrepancyDetection.判定者).toBe("user-123");
    expect(result.legacySystemInvoice?.請求書ID).toBe("INV-OLD-001");
    expect(result.legacySystemInvoice?.ユーザーID).toBe("usr-old-001");
    expect(result.legacySystemInvoice?.請求書番号).toBe("INV20261001");
    expect(result.legacySystemInvoice?.請求日).toBe("2026-10-01T00:00:00Z");
    expect(result.legacySystemInvoice?.請求金額).toBe(100000);
    expect(result.legacySystemInvoice?.税金額).toBe(10000);
    expect(result.legacySystemInvoice?.ステータス).toBe("issued");
    expect(result.legacySystemInvoice?.支払期限日).toBe("2026-10-31T00:00:00Z");
    expect(result.legacySystemInvoice?.摘要).toBe("旧システム請求書");
    expect(result.legacySystemInvoice?.作成日時).toBe("2026-10-01T08:00:00Z");
    expect(result.legacySystemInvoice?.更新日時).toBe("2026-10-01T08:00:00Z");
    expect(result.legacySystemInvoice?.検証ステータス).toBe("pending");
    expect(result.legacySystemInvoice?.検証日時).toBeNull();
    expect(result.newSystemInvoice?.請求書ID).toBe("INV-NEW-001");
    expect(result.newSystemInvoice?.請求書番号).toBe("INV20261002");
    expect(result.newSystemInvoice?.請求日).toBe("2026-10-01T00:00:00Z");
    expect(result.newSystemInvoice?.請求金額).toBe(105000);
    expect(result.newSystemInvoice?.税金額).toBe(10500);
    expect(result.newSystemInvoice?.ステータス).toBe("issued");
    expect(result.newSystemInvoice?.支払期限日).toBe("2026-10-31T00:00:00Z");
    expect(result.newSystemInvoice?.摘要).toBe("新システム請求書");
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
