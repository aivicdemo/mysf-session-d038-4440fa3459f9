import { retrieveDiscrepanciesForCSVExport, InvalidDiscrepancyIdFormat } from "../../src/logic/discrepancy-persistence";
import * as dataStore from "../../src/platform/data-store";

jest.mock("../../src/platform/data-store");

describe("SCEN-224: 指定された差異IDが空文字列の場合、InvalidDiscrepancyIdFormatエラーを発生させる", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("空文字列の差異IDを含むリストを指定した場合、InvalidDiscrepancyIdFormatエラーが発生する", async () => {
    const discrepancyIds = [""];

    await expect(retrieveDiscrepanciesForCSVExport({ discrepancyIds })).rejects.toThrow(
      InvalidDiscrepancyIdFormat
    );

    // 差異検出結果テーブルへのアクセスが行われていないことを確認
    expect(dataStore.listRecords).not.toHaveBeenCalledWith("差異検出結果");
  });
});
