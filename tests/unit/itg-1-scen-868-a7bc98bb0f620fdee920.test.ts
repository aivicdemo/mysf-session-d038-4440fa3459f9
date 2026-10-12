import { fetchAllActivityFrequencies } from "../../src/logic/data-persistence";
import * as dataStore from "../../src/platform/data-store";
import { DataStoreError } from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-868: fetchAllActivityFrequencies - 活動頻度マスタへのアクセスに失敗したとき、「活動頻度マスタの取得に失敗しました。」というメッセージのDataStoreErrorを発生させる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("DataStoreError が発生し、エラー文言が「活動頻度マスタの取得に失敗しました。」である", async () => {
    const error = new DataStoreError("活動頻度マスタの取得に失敗しました。");
    (dataStore.listRecords as jest.Mock).mockRejectedValue(error);

    await expect(fetchAllActivityFrequencies({})).rejects.toThrow(DataStoreError);
    await expect(fetchAllActivityFrequencies({})).rejects.toThrow("活動頻度マスタの取得に失敗しました。");
  });
});
