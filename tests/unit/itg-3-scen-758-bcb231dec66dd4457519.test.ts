import { jest } from "@jest/globals";
import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-758: 差異の種類が空または未定義の場合、エラーメッセージが返され評価処理が中止される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("差異種類がnullの場合、DataStoreErrorが発生する", async () => {
    const discrepancyId = "550e8400-e29b-41d4-a716-446655440000";

    const discrepancyRecord = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      差異ID: "550e8400-e29b-41d4-a716-446655440000",
      旧システム請求書ID: "LEGACY-2024-001",
      新システム請求書ID: "NEW-2024-001",
      差異種類: null,
      差異内容: "金額不一致",
      金額差異: 50000,
      件数差異: 0,
      ステータス差異: "",
      検出日時: "2024-01-15T10:30:00Z",
      重大度: "high",
      原因分類: "data_mapping",
      許容範囲判定: "out_of_range",
      判定日時: "2024-01-15T11:00:00Z",
      判定者: "user-001",
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "差異検出結果") {
        return Promise.resolve([discrepancyRecord]);
      }
      return Promise.resolve([]);
    });

    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(DataStoreError);
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow("データベースアクセスエラーが発生しました。");
  });
});
