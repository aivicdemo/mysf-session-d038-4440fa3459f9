import { fetchAllActivityFrequencies } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-867: fetchAllActivityFrequencies - 活動頻度マスタが空のとき、空の配列と総件数0とISO 8601形式の取得時刻を返す", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("活動頻度マスタテーブルが空のとき、空の配列を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllActivityFrequencies({});

    expect(result.activityFrequencies).toEqual([]);
  });

  it("totalCount は 0 を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllActivityFrequencies({});

    expect(result.totalCount).toBe(0);
  });

  it("fetchedAt は ISO 8601 形式の取得時刻を返す", async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const result = await fetchAllActivityFrequencies({});

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
