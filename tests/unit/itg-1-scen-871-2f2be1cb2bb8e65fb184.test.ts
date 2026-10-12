import { fetchAllValidationRules } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-871: fetchAllValidationRules - ルール定義が1件も保存されていない状況で、空の配列と総件数0を返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validationRules フィールドが空配列 [] を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllValidationRules({});

    expect(result.validationRules).toEqual([]);
  });

  it("totalCount フィールドが 0 を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllValidationRules({});

    expect(result.totalCount).toBe(0);
  });

  it("fetchedAt フィールドが ISO 8601 形式の日時文字列を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllValidationRules({});

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
