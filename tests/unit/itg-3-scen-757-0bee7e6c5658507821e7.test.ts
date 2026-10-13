import { jest } from "@jest/globals";
import { retrieveDiscrepancyDetailsForConfirmation, DiscrepancyNotFoundError } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-757: 全データ件数が0の場合、エラーメッセージが返され許容率の判定が中止される", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("差異検出結果テーブルが空の場合、DiscrepancyNotFoundErrorが発生する", async () => {
    const discrepancyId = "550e8400-e29b-41d4-a716-446655440000";

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === "差異検出結果") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(DiscrepancyNotFoundError);
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow("指定された差異IDのレコードが見つかりません。");
  });
});
