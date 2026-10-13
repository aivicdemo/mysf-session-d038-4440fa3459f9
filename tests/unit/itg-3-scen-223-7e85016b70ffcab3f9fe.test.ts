import { retrieveDiscrepanciesForCSVExport, EmptyDiscrepancyIdList } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-223: 差異IDリストが空の場合、EmptyDiscrepancyIdListエラーを発生させる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("空の差異IDリストを指定した場合、EmptyDiscrepancyIdListエラーが発生する", async () => {
    const discrepancyIds: string[] = [];

    await expect(retrieveDiscrepanciesForCSVExport({ discrepancyIds })).rejects.toThrow(
      EmptyDiscrepancyIdList
    );

    // 差異検出結果テーブルへのアクセスが行われていないことを確認
    expect(dataStore.listRecords).not.toHaveBeenCalledWith("差異検出結果");
  });
});
